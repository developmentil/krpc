process.env.NODE_ENV = 'test';

var KRPC = require('../krpc');
	
describe('KRPC', function() {
	var krpc;
	
	before(function() {
		krpc = new KRPC();
	});

	describe('#parse()', function() {
		
		it('should throw an error', function() {
			try {
				krpc.parse(new Buffer(2), '1.1.1.1', 20000);
			} catch(err) {
				return;
			}
			
			throw new Error('Parse should throw an error');
		});
		
		it('should emit "parseError" and throw an error', function() {
			var refs = 0,
			
			myTransId = 'aa', myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('parseError', function(transId, errorMsg, ip, port) {
				transId.should.equal(myTransId);
				errorMsg.should.be.a.String;
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			try {
				krpc.parse(krpc.encode({t: myTransId, y: 'q'}), myIp, myPort);
			} catch(err) {
				refs.should.equal(1);
				return;
			}
			
			throw new Error('Parse should throw an error');
		});
		
		it('should emit "query" and "query_{type}"', function() {
			var refs = 0,
			
			myTransId = 'aa', myType = 'myType', myQuery = {foo: 'bar'},
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('query', function(type, query, transId, ip, port) {
				type.should.equal(myType);
				query.should.equal(query);
				transId.should.equal(myTransId);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once('query_' + myType, function(query, transId, ip, port) {
				query.should.equal(query);
				transId.should.equal(myTransId);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			var buffer = krpc.query(myTransId, myType, myQuery);
			krpc.parse(buffer, myIp, myPort);
			
			refs.should.equal(2);
		});
		
		it('should emit "respond" and "{transId}"', function() {
			var refs = 0,
			
			myTransId = 'aa', myRes = {foo: 'bar'},
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('respond', function(res, transId, ip, port) {
				res.should.eql(myRes);
				transId.should.equal(myTransId);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once(myTransId, function(err, ip, port, res) {
				(err === null).should.be.true;
				ip.should.equal(myIp);
				port.should.equal(myPort);
				res.should.eql(myRes);
				
				refs++;
			});
			
			var buffer = krpc.respond(myTransId, myRes);
			krpc.parse(buffer, myIp, myPort);
			
			refs.should.equal(2);
		});
		
		it('should emit "error" and "{transId}"', function() {
			var refs = 0,
			
			myTransId = 'aa', myErrorCode = 123, myErrorMsg = 'my message',
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('error', function(errorCode, errorMsg, transId, ip, port) {
				errorCode.should.eql(myErrorCode);
				errorMsg.should.eql(myErrorMsg);
				transId.should.equal(myTransId);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once(myTransId, function(err, ip, port, res) {
				(err !== null).should.be.true;
				err.code.should.equal(myErrorCode);
				err.message.should.equal(myErrorMsg);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				(!res).should.be.true;
				
				refs++;
			});
			
			var buffer = krpc.error(myTransId, myErrorCode, myErrorMsg);
			krpc.parse(buffer, myIp, myPort);
			
			refs.should.equal(2);
		});
	});
});