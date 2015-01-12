process.env.NODE_ENV = 'test';

var KRPC = require('../krpc');
	
describe('KRPC', function() {
	var krpc;

	describe('#constructor()', function() {
		it('should construct without arguments', function() {
			krpc = new KRPC();
		});
	});

	describe('bencode', function() {
		var buffer, testObj = {
			string: 'Hello World',
			integer: 12345,
			dict: {
				key: 'This is a string within a dictionary'
			},
			list: [ 1, 2, 3, 4, 'string', 5, {} ]
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
			
			transId.should.be.a.String;
			transId.should.not.be.empty;
		});
		
		it('should return different values', function() {
			var ids = {};
			ids[transId] = 1;
			
			for(var i = 0; i < 100; i++) {
				var otherTransId = krpc.genTransId();

				otherTransId.should.be.a.String;
				otherTransId.should.have.length(transId.length);
				
				ids.should.not.have.ownProperty(otherTransId);
				ids[otherTransId] = 1;
			}
		});
	});

	describe('#query()', function() {
		it('should return an encoded Buffer', function() {
			var transId = 'abcdefg',
			type = 'foo',
			query = {foo: 'bar'},
			
			buffer = krpc.query(transId, type, query),
			compare = krpc.encode({t: transId, y: 'q', q: type, a: query});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
	});

	describe('#respond()', function() {
		it('should return an encoded Buffer', function() {
			var transId = 'abcdefg',
			res = {foo: 'bar'},
			
			buffer = krpc.respond(transId, res),
			compare = krpc.encode({t: transId, y: 'r', r: res});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
	});

	describe('#error()', function() {
		it('should return an encoded Buffer', function() {
			var transId = 'abcdefg',
			errorCode = 555,
			errorMsg = 'my error message',
			
			buffer = krpc.error(transId, errorCode, errorMsg),
			compare = krpc.encode({t: transId, y: 'e', e: [errorCode, errorMsg]});

			buffer.should.be.an.instanceOf(Buffer);
			buffer.toString().should.equal(compare.toString());
		});
	});
});