	
describe('KRPC', function() {
	var KRPC, krpc;
	
	before(function() {
		KRPC = require('../krpc');
	});

	describe('#constructor()', function() {
		it('should construct without arguments', function() {
			krpc = new KRPC();
		});
	});

	describe('bencode', function() {
		var buffer, testObj = {
			string: new Buffer('Hello World'),
			integer: 12345,
			dict: {
				key: new Buffer('This is a string within a dictionary')
			},
			list: [ 1, 2, 3, 4, new Buffer('string'), 5, {} ]
		};
		
		it('should encode correctly', function() {
			buffer = krpc.encode(testObj);

			buffer.should.be.an.instanceOf(Buffer);

			buffer.toString().should.equal(
				'd4:dictd3:key36:This is a string within a dictionary' + 
				'e7:integeri12345e4:listli1ei2ei3ei4e6:stringi5ede' + 
				'e6:string11:Hello Worlde'
			);
		});
		
		it('should decode correctly', function() {
			var compare = krpc.decode(buffer);
			
			compare.should.eql(testObj);
		});
	});

	describe('#genTransId()', function() {
		var transId;
		
		it('should call without arguments', function() {
			transId = krpc.genTransId();
			
			transId.should.be.an.instanceOf(Buffer);
			transId.should.not.be.empty;
		});
		
		it('should return different values', function() {
			var ids = {};
			ids[transId.toString('hex')] = 1;
			
			for(var i = 0; i < 100; i++) {
				var otherTransId = krpc.genTransId();

				otherTransId.should.be.an.instanceOf(Buffer);
				otherTransId.should.have.length(transId.length);
				
				var property = otherTransId.toString('hex');
				ids.should.not.have.ownProperty(property);
				ids[property] = 1;
			}
		});
	});

	describe('#query()', function() {
		it('should return an encoded Buffer', function() {
			var transId = new Buffer('1a2b3c4d5e6f', 'hex'),
			type = 'foo',
			query = {foo: new Buffer('bar')},
			
			buffer = krpc.query(transId, type, query),
			compare = krpc.encode({t: transId, y: 'q', q: type, a: query});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
		
		it('should work with any transaction id', function() {
			var transId = 12345,
			type = 'foo',
			query = {foo: 9876},
			
			buffer = krpc.query(transId, type, query),
			compare = krpc.encode({t: transId, y: 'q', q: type, a: query});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
	});

	describe('#respond()', function() {
		it('should return an encoded Buffer', function() {
			var transId = new Buffer('1a2b3c4d5e6f', 'hex'),
			res = {foo: new Buffer('bar')},
			
			buffer = krpc.respond(transId, res),
			compare = krpc.encode({t: transId, y: 'r', r: res});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
		
		it('should work with any transaction id', function() {
			var transId = 12345,
			res = {foo: 9876},
			
			buffer = krpc.respond(transId, res),
			compare = krpc.encode({t: transId, y: 'r', r: res});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
	});

	describe('#error()', function() {
		it('should return an encoded Buffer', function() {
			var transId = new Buffer('1a2b3c4d5e6f', 'hex'),
			errorCode = 555,
			errorMsg = 'my error message',
			
			buffer = krpc.error(transId, errorCode, errorMsg),
			compare = krpc.encode({t: transId, y: 'e', e: [errorCode, errorMsg]});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
		
		it('should work with any transaction id', function() {
			var transId = 12345,
			errorCode = 555,
			errorMsg = 'my error message',
			
			buffer = krpc.error(transId, errorCode, errorMsg),
			compare = krpc.encode({t: transId, y: 'e', e: [errorCode, errorMsg]});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
	});
});