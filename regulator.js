exports.update = update;
exports.get = get;
exports.heater = heater;
exports.connect = connect;
exports.disconnect = disconnect;
exports.metric = metric;
exports.metrics = metrics;
exports.newAlias = newAlias;
exports.allAliases = allAliases;

var MongoClient = require('mongodb').MongoClient
const staticConfig = require('./static-config');

var url = 'mongodb://localhost:27017/smarthome';
if (process.env.MONGO_URL) {
    url = process.env.MONGO_URL;
}
var mongoDb;
var connected = false;
// Connect using MongoClient

function disconnect(done) {

    mongoDb.close(true).then(done);
    mongoDb = null;
    connected = false;
}
function connect(done) {
    console.log("Connecting to %s", url);
    if (connected) {
        done();
        console.log("Already connected", url);
        return;
    }
    MongoClient.connect(url, function (err, db) {
        if (err) {
            throw err;
        }
        if (mongoDb == null) {
            mongoDb = db;
        } else {
            db.close(true);
        }
        console.log("Connected to %s", url);
        connected = true;
        if (done) {
            done();
        }
    });

}
connect(() => { console.log("Connected") });

function setConfig(params) {

    var values = {
        tenant: params.tenant,
        channel: params.channel
    };
    return mongoDb.collection("keys").updateOne({
        _id: params.key,
        tenant: params.tenant
    }, { "$set": values }, { upsert: true });
}

function getConfig(key) {
    if (staticConfig.keys[key]) {
        return Promise.resolve({ tenant: staticConfig.keys[key] });
    }
    return mongoDb.collection("keys").findOne({ _id: key });
}

function update(tenant, params) {
    var values = { state: params.state };
    if (params.state == "auto") {
        if (params.temperature) {
            values.temperature = Number(params.temperature);
        }
        if (params.deviation) {
            values.deviation = Number(params.deviation);
        }
        if (params.sensor) {
            values.sensor = params.sensor;
        }
    }
    if (params.state == 'on') {
        values.heater = 1;
    }
    if (params.state == 'off') {
        values.heater = 0;
    }
    return mongoDb.collection("regulator").updateOne({ _id: tenant }, { "$set": values }, { upsert: true })
}

function get(tenant) {
    return mongoDb.collection("regulator").findOne({ _id: tenant });
}

async function heater(apiKey) {
    const config = await getConfig(apiKey)
    const regulator = await get(config.tenant);
    const sensors = await metrics(config.tenant);
    const field = regulator.sensor;
    var temperature = Number(sensors.filter(function (sensor) {
        return sensor.chipId == field
    })[0].t);
    var response = regulator.heater || 0;
    if (regulator.state == 'auto') {
        if (temperature < regulator.temperature - regulator.deviation) {
            response = 1;
        } else if (temperature > regulator.temperature + regulator.deviation) {
            response = 0;
        }
        if (response != regulator.heater) {
            await mongoDb.collection("regulator").updateOne({ _id: config.tenant }, { "$set": { heater: response } }, { upsert: true });
        }
    }
    return response;
}


async function metric(key, data) {
    const config = await getConfig(key);
    var value = {
        tenant: config.tenant,
        t: data.t,
        vcc: data.vcc,
        chipId: data.id,
        createdAt: new Date().toISOString()
    };
    if (data.heater !== undefined) {
        value.heater = data.heater;
    }
    await mongoDb.collection("current_metrics").updateOne({
        tenant: value.tenant,
        chipId: value.chipId
    }, value, { upsert: true });
    return await mongoDb.collection("metrics").insertOne(value);

}


function findAlias(aliases, chipId) {
    var filtered = aliases.filter(function (alias) {
        return alias.chipId == chipId
    });
    if (filtered.length == 1) {
        return filtered[0].name;
    } else {
        return chipId;
    }
}

async function metrics(tenant) {
    const feed = await mongoDb.collection("current_metrics").find({ tenant: tenant }).sort({ _id: -1 }).limit(50).toArray();
    const aliases = await allAliases(tenant);
    var now = new Date().getTime();
    return feed.map(function (doc) {
        delete doc['_id'];
        delete doc['tenant'];
        doc.age = (now - new Date(doc.createdAt).getTime()) / 1000;
        doc.alias = findAlias(aliases, doc.chipId);
        return doc;
    });
}

function newAlias(tenant, chipId, name) {
    return mongoDb.collection("aliases").updateOne({ tenant: tenant, chipId: chipId }, {
        tenant: tenant,
        chipId: chipId,
        name: name
    }, { upsert: true });
}

function allAliases(tenant) {
    return mongoDb.collection("aliases").find({ tenant: tenant }).toArray();
}


console.log(JSON.stringify(staticConfig));