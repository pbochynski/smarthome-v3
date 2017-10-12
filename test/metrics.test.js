var request = require('supertest');
var should = require('should');
var regulator = require('../regulator');
var app = require('../app');


function findMetric(metrics, chipId) {
	var filtered = metrics.filter((metric) => {return metric.chipId===chipId});
	return (filtered.length==1) ? filtered[0] : {};
}

describe('Metrics endpoint', function () {
	before(function(done) {
		regulator.connect(done);
	})


	it('should store first metric', function (done) {

		request(app)
			.post('/metrics?api_key=TEST')
			.send({id:"1",t:21.1, vcc:3.61, heater: 0})
			.expect(200,done);
	});
	it('should store second metric', function (done) {

		request(app)
			.post('/metrics?api_key=TEST')
			.send({id:"2",t:21.2, vcc:3.62, heater: 1})
			.expect(200,done);
	});
	it('should read metrics', function (done) {

		request(app)
			.get('/metrics')
			.set('tenant','test')
			.send()
			.expect(200)
			.end(function (err, res) {

				if (err) return done(err);
				var metric1 = findMetric(res.body,'1');
				var metric2 = findMetric(res.body,'2');
				metric2.should.have.property('chipId','2');
				metric2.should.have.property('t',21.2);
				metric2.should.have.property('vcc',3.62);
				metric2.should.have.property('heater',1);
				metric1.should.have.property('chipId','1');
				metric1.should.have.property('t',21.1);
				metric1.should.have.property('vcc',3.61);
				metric1.should.have.property('heater',0);
				done();
			})
	});
	it('should override metric', function (done) {

		request(app)
			.post('/metrics?api_key=TEST')
			.send({id:'2',t:21.3, vcc:3.63, heater:0})
			.expect(200,done);
	});
	it('should read metrics', function (done) {

		request(app)
			.get('/metrics')
			.set('tenant','test')
			.send()
			.expect(200)
			.end(function (err, res) {

				if (err) return done(err);
				var metric = findMetric(res.body,'2');
				metric.should.have.property('chipId','2');
				metric.should.have.property('t',21.3);
				metric.should.have.property('vcc',3.63);
				metric.should.have.property('heater',0);
				done();
			})
	});

});