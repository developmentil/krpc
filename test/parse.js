	
describe('KRPC', function() {
	var KRPC, krpc;
	
	before(function() {
		KRPC = require('../krpc');
		krpc = new KRPC();
	});

	describe('#parse()', function() {
		
		it('should throw an error', function() {
			try {
				krpc.parse(new Buffer(2), '1.1.1.1', 20000);
			} catch(err) {
				err.should.be.an.instanceof(Error);
				return;
			}
			
			throw new Error('Parse should throw an error');
		});
		
		it('should throw a ForeignError', function() {
			var refs = 0, tada = new Error('Tada!');
			
			krpc.once('query_error', function() {
				throw tada;
			});
			
			krpc.once('parseError', function() {
				refs++;
			});
			
			var buffer = krpc.query(new Buffer('aa'), 'error', {foo: 123456});
			
			try {
				krpc.parse(buffer, '1.1.1.1', 20000);
			} catch(err) {
				refs.should.equal(0);
				err.should.be.an.instanceof(KRPC.ForeignError);
				err.error.should.equal(tada);
				return;
			}
			
			throw new Error('Parse should throw an error');
		});
		
		it('should emit "parseError" and throw an error', function() {
			var refs = 0,
			
			myTransId = new Buffer('aa'), myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('parseError', function(transId, errorMsg, ip, port) {
				transId.toString('hex').should.equal(myTransId.toString('hex'));
				errorMsg.should.be.a.String;
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			try {
				krpc.parse(krpc.encode({t: myTransId, y: 'q'}), myIp, myPort);
			} catch(err) {
				err.should.be.an.instanceof(Error);
				refs.should.equal(1);
				return;
			}
			
			throw new Error('Parse should throw an error');
		});
		
		it('should emit "query" and "query_{type}"', function() {
			var refs = 0,
			
			myTransId = new Buffer('aa'), 
			myType = 'myType', myQuery = {foo: 123456},
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('query', function(type, query, transId, ip, port) {
				type.should.equal(myType);
				query.should.eql(myQuery);
				transId.toString('hex').should.equal(myTransId.toString('hex'));
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once('query_' + myType, function(query, transId, ip, port) {
				query.should.eql(myQuery);
				transId.toString('hex').should.equal(myTransId.toString('hex'));
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
			
			myTransId = new Buffer('aa'), myRes = {foo: 123456},
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('respond', function(res, transId, ip, port) {
				res.should.eql(myRes);
				transId.toString('hex').should.equal(myTransId.toString('hex'));
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once(myTransId.toString('hex'), function(err, ip, port, res) {
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
			
			myTransId = new Buffer('aa'), 
			myErrorCode = 123, myErrorMsg = 'my message',
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('error', function(errorCode, errorMsg, transId, ip, port) {
				errorCode.should.equal(myErrorCode);
				errorMsg.should.equal(myErrorMsg);
				transId.toString('hex').should.equal(myTransId.toString('hex'));
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once(myTransId.toString('hex'), function(err, ip, port, res) {
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
		
		it('should parse any transaction id', function() {
			var refs = 0,
			
			myTransId = 123456, 
			myType = 'myType', myQuery = {foo: 123456},
			myIp = '1.1.1.1', myPort = 20000;
			
			krpc.once('query', function(type, query, transId, ip, port) {
				type.should.equal(myType);
				query.should.eql(myQuery);
				transId.should.equal(myTransId);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			krpc.once('query_' + myType, function(query, transId, ip, port) {
				query.should.eql(myQuery);
				transId.should.equal(myTransId);
				ip.should.equal(myIp);
				port.should.equal(myPort);
				
				refs++;
			});
			
			var buffer = krpc.query(myTransId, myType, myQuery);
			krpc.parse(buffer, myIp, myPort);
			
			refs.should.equal(2);
		});
	});
});