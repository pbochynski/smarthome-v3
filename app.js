/*jslint es6 */
'use strict';

const express = require('express');
var bodyParser = require('body-parser');
const regulator = require('./regulator');
const path = require('path');

const app = express();
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const audience = "111955432370-0r8pj7ueegnukqsoa9othk8pgnkdvtju.apps.googleusercontent.com";
const issuer = "accounts.google.com";
const staticConfig = require('./static-config');



// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Tenant
app.use(function (req, res, next) {
  req.tenant = req.headers['tenant'] || 'pihome';
  next();
});


function regulatorUpdate(req, res) {
  regulator.update(req.headers['tenant'] || 'pihome', req.query).then(function () {
    res.end()
  });
}
function regulatorGet(req, res) {
  regulator.get(req.headers['tenant'] || 'pihome').then(function (doc) {
    delete doc['_id'];
    res.json(doc);
  });
}
function metrics(req, res) {
  regulator.metrics(req.headers['tenant'] || 'pihome').then(function (doc) {
    res.json(doc);
  });
}

function heater(req, res) {
  regulator.heater(req.query.api_key).then(function (response) {
    res.set('Content-Type', 'text/html');
    res.status(200);
    res.send(response.toString());
  });
}


function metric(req, res) {
  regulator.metric(req.query.api_key, req.body).then(function () {
    res.sendStatus(200);
  }).catch(function (err, result) {
    console.error(err);
    res.sendStatus(500)
  });

}

function newAlias(req, res) {
  regulator.newAlias(req.headers['tenant'] || 'pihome', req.body.chipId, req.body.name);
  res.sendStatus(201);

}
function allAliases(req, res) {
  regulator.allAliases(req.headers['tenant'] || 'pihome').then(function (doc) {
    res.json(doc);
  });

}

app.get('/heater', heater);
app.post('/metrics', metric);

if (!process.env.TEST) {
  app.use(jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 2,
      jwksUri: `https://www.googleapis.com/oauth2/v3/certs`
    }),
    audience: audience,
    issuer: issuer,
    algorithms: ['RS256']
  }));
  app.use(function (req, res, next) {
    if (staticConfig.users[req.tenant] && req.user.email &&
      staticConfig.users[req.tenant].indexOf(req.user.email.toLowerCase()) >= 0) {
      return next();
    }
    return res.status(403).send("Unauthorized user");
  });
}

app.post('/aliases', newAlias);
app.get('/aliases', allAliases);

app.post('/regulator', regulatorUpdate);
app.get('/regulator', regulatorGet);

app.get('/metrics', metrics);

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send('invalid token...');
  }
});

module.exports = app
