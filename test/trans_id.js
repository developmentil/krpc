	
describe('KRPC', function() {
	var KRPC, krpc,
	
	transIdBytes = 4,
	queryTimeout = 10;
	
	before(function() {
		KRPC = require('../krpc');
		
		krpc = new KRPC({
			transIdBytes: transIdBytes,
			queryTimeout: queryTimeout
		});
	});

	describe('#genTransId()', function() {
		var resSend = {foo: 'bar'};
		
		it('should call without ip and port', function(done) {
			var transId = krpc.genTransId(function(err, res) {
				(err === null).should.be.true;
				res.should.equal(resSend);
				done();
			});
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
			
			var transIdHex = transId.toString('hex');
			krpc.emit(transIdHex, null, '1.1.1.1', 20000, resSend);
		});
		
		it('should callback with timeout error', function(done) {
			var timer = setTimeout(function() {
				done(new Error('Timeout error missing'));
			}, queryTimeout + 5),
			
			transId = krpc.genTransId(function(err) {
				(err !== null).should.be.true;
				
				clearTimeout(timer);
				done();
			});
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
		});
		
		it('should callback with custom timeout', function(done) {
			var timeout = 50,
			
			timer = setTimeout(function() {
				done(new Error('Timeout error missing'));
			}, timeout + 5),
			
			transId = krpc.genTransId(function(err) {
				(err !== null).should.be.true;
				
				clearTimeout(timer);
				done();
			}, timeout);
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
		});
		
		it('should filter ip', function(done) {
			var ip = '1.1.1.1',
			
			transId = krpc.genTransId(ip, function(err, res) {
				(err === null).should.be.true;
				
				res.should.equal(ip);
				done();
			});
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
			
			var transIdHex = transId.toString('hex');
			krpc.emit(transIdHex, null, '1.1.1.2', 20000, '1.1.1.2');
			krpc.emit(transIdHex, null, ip, 20000, ip);
		});
		
		it('should filter port', function(done) {
			var ip = '1.1.1.1', port = 20000,
			
			transId = krpc.genTransId(ip, port, function(err, res) {
				(err === null).should.be.true;
				
				res.ip.should.equal(ip);
				res.port.should.equal(port);
				done();
			});
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
			
			var transIdHex = transId.toString('hex');
			krpc.emit(transIdHex, null, '1.1.1.2', port, {ip: '1.1.1.2', port: port});
			krpc.emit(transIdHex, null, ip, 5000, {ip: ip, port: 5000});
			krpc.emit(transIdHex, null, ip, port, {ip: ip, port: port});
		});
		
		it('should receive multiple messages', function(done) {
			var count = 5, refs = count,
			
			transId = krpc.genTransId(function(err, i) {
				(err === null).should.be.true;
				i.should.equal(refs--);
				
				if(refs === 0)
					done();
			});
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
			
			var transIdHex = transId.toString('hex');
			for(var i = count; i > 0; i--) {
				krpc.emit(transIdHex, null, '1.1.1.2', 20000, i);
			}
		});
		
		it('should not receive messages after timeout', function(done) {
			var refs = 0,
			
			transId = krpc.genTransId(function(err, i) {
				(err !== null).should.be.true;
				refs++;
			});
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.have.length(transIdBytes);
			
			setTimeout(function() {
				var transIdHex = transId.toString('hex');
				krpc.emit(transIdHex, null, '1.1.1.1', 20000, resSend);
				
				refs.should.be.equal(1);
				done();
			}, queryTimeout + 5);
		});
	});
});