var events = require('events'),
	util = require('util'),
	crypto = require('crypto'),
	bencode = require('bencode'),
	
	TRANS_ID_BYTES = 2;
	
module.exports = exports = function(options) {
	events.EventEmitter.call(this);
	
	if(!options) options = {};
	
	this._transIdBytes = options.transIdBytes || 2;
	this._nextTransId = crypto.randomBytes(this._transIdBytes);
	
	this._queryTimeout = options.queryTimeout || 2000;
	this._queryTimers = {};
};
util.inherits(exports, events.EventEmitter);
var proto = exports.prototype;


/*** constants ***/

exports.Errors = {
	GENERIC:         201,
	SERVER:          202,
	PROTOCOL:        203,
	METHOD_UNKNOWN:  204
};


/*** public methods ***/

proto.parse = function(buffer, ip, port) {
	var msg = this.decode(buffer);
	
	if(!msg.t)
		throw new Error('Missing transaction id');
	
	var method = '_parseType_' + msg.y;
	if(!this[method])
		throw new Error('Invaild message type');
	
	this[method](msg, ip, port);
	return msg;
};

proto.genTransId = function(ip, port, callback, timeout) {
	var self = this,
	transId = this._nextTransId.toString('hex'),
	transIdBuffer = new Buffer(transId, 'hex');
	
	if(typeof ip === 'function') {
		callback = ip;
		timeout = port;
		ip = null;
		port = null;
	} else if(typeof port === 'function') {
		callback = port;
		timeout = callback;
		port = null;
	}
	
	// increase _nextTransId
	for(var i = 0; i < this._nextTransId.length; i++) {
		if(this._nextTransId[i] !== 0xff) {
			this._nextTransId[i]++;
			break;
		}
		
		this._nextTransId[i] = 0x00;
	}
	
//	if(this._queryTimers[transId]) {
//		this.emit(transId, new Error('Timeout'));
//		this.removeAllListeners(transId);
//	}
	
	if(typeof callback === 'function') {
		var listener = function(err, rIp, rPort, res) {
			if(ip !== rIp && ip)
				return;

			if(port !== rPort && port)
				return;

			if(self._queryTimers[transId])
				delete self._queryTimers[transId];

			callback.call(null, err, res);
		};
		
		if(timeout === undefined)
			timeout = this._queryTimeout;
		
		if(timeout) {
			this._queryTimers[transId] = setTimeout(function() {
				self.removeListener(transId, listener);
				
				if(!self._queryTimers[transId])
					return;
				
				delete self._queryTimers[transId];
				callback(new Error('Timeout'));
			}, timeout);
		}

		this.on(transId, listener);
	} else {
		delete this._queryTimers[transId];
	}
	
	return transIdBuffer;
};

proto.query = function(transId, type, query) {
	return this.encode({
		t: transId,
		y: 'q',
		q: type,
		a: query
	});
};

proto.respond = function(transId, res) {
	return this.encode({
		t: transId,
		y: 'r',
		r: res
	});
};

proto.error = function(transId, errorCode, errorMsg) {
	return this.encode({
		t: transId,
		y: 'e',
		e: [errorCode, errorMsg]
	});
};

proto.encode = function(msg) {
	return bencode.encode(msg);
};

proto.decode = function(buffer) {
	return bencode.decode(buffer);
};


/*** protected methods ***/ 

proto._parseType_q = function(msg, ip, port) {
	if(!(msg.q instanceof Buffer)) {
		this.emit('parseError', msg.t, 'Missing query type', ip, port);
		throw new Error('Missing query type');
	}
		
	if(!msg.a) {
		this.emit('parseError', msg.t, 'Missing query data', ip, port);
		throw new Error('Missing query data');
	}
	
	var type = msg.q.toString();
		
	this.emit('query', type, msg.a, msg.t, ip, port);
	this.emit('query_' + type, msg.a, msg.t, ip, port);
};

proto._parseType_r = function(msg, ip, port) {
	if(!msg.r)
		throw new Error('Missing respond data');
	
	this.emit('respond', msg.r, msg.t, ip, port);
	this.emit(msg.t.toString('hex'), null, ip, port, msg.r);
};

proto._parseType_e = function(msg, ip, port) {
	if(!Array.isArray(msg.e) || msg.e.length !== 2 || typeof msg.e[0] !== 'number')
		throw new Error('Invaild error data');
		
	
	var code = msg.e[0],
	message = msg.e[1] ? msg.e[1].toString() : 'Unknown Error',
	
	err = new Error(message);
	err.code = code;
	
	this.emit('error', code, message, msg.t, ip, port);
	this.emit(msg.t.toString('hex'), err, ip, port);
};


