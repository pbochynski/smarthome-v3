var request = require('supertest');
var should = require('should');
var regulator = require('../regulator');
var app = require('../app');


describe('Regulator endpoint', function () {
	before(function(done) {
		regulator.connect(done);
	})
	after(function(done) {
		regulator.disconnect(done);
	})


	it('should turn heater off', function (done) {
		request(app)
			.post('/regulator?state=off')
			.set('tenant','test')
			.send()
			.expect(200, done);
	});
	it.skip('should heater be off', function (done) {
		request(app)
			.get('/heater?api_key=TEST')
			.send()
			.expect(200, '0', done);
	});
	it('should set regulator', function (done) {

		request(app)
			.post('/regulator?state=auto&temperature=21.4&deviation=0.1&sensor=1')
			.set('tenant','test')
			.expect(200,done);
	});
	it('should get regulator', function (done) {
		request(app)
			.get('/regulator')
			.set('tenant','test')
			.send()
			.expect(200)
			.end(function(err,res){
				if (err) return done(err);
				res.body.should.have.property('state','auto');
				res.body.should.have.property('temperature',21.4);
				res.body.should.have.property('deviation',0.1);
				res.body.should.have.property('sensor','1');
				done();
			});
	});
	it('should store sensor metric (cold)', function (done) {

		request(app)
			.post('/metrics?api_key=TEST')
			.send({id:"1",t:21.1, vcc:3.61})
			.expect(200,done);
	});
	it('should heater be on', function (done) {
		request(app)
			.get('/heater?api_key=TEST')
			.send()
			.expect(200)
			.expect('1', done);
	});
	it('should store sensor metric (hot)', function (done) {

		request(app)
			.post('/metrics?api_key=TEST')
			.send({id:"1",t:21.6, vcc:3.61})
			.expect(200,done);
	});
	it('should heater be off', function (done) {
		request(app)
			.get('/heater?api_key=TEST')
			.send()
			.expect(200)
			.expect('0', done);
	});
	it('should store sensor metric (warm)', function (done) {

		request(app)
			.post('/metrics?api_key=TEST')
			.send({id:"1",t:21.31, vcc:3.61})
			.expect(200,done);
	});
	it('should heater still be off', function (done) {
		request(app)
			.get('/heater?api_key=TEST')
			.send()
			.expect(200)
			.expect('0', done);
	});
});