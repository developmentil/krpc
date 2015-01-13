# KRPC.js

[![build](https://img.shields.io/travis/DevelopmentIL/krpc.svg)](https://travis-ci.org/DevelopmentIL/krpc)
[![npm](https://img.shields.io/npm/v/krpc.svg)](https://npmjs.org/package/krpc)
[![npm](https://img.shields.io/npm/dm/krpc.svg)](https://npmjs.org/package/krpc)
[![npm](https://img.shields.io/npm/l/krpc.svg)](https://github.com/DevelopmentIL/krpc/blob/master/LICENSE)

Simple KRPC protocol implementation of bencoded messages.
See [BitTorent DHT specifications](http://www.bittorrent.org/beps/bep_0005.html) for more details.


## Install

	$ npm install krpc



## API
  * [KRPC (constructor)](#krpc-constructor)
  * [KRPC.Errors](#krpcerrors)
  * [KRPC.ForeignError](#krpcforeignerror)
  * [krpc.parse](#krpcparse)
  * [krpc.genTransId](#krpcgentransid)
  * [krpc.query](#krpcquery)
  * [krpc.respond](#krpcrespond)
  * [krpc.error](#krpcerror)
  * [krpc.on('parseError')](#krpconparseerror)
  * [krpc.on('query')](#krpconquery)
  * [krpc.on('query_{type}')](#krpconquery_type)
  * [krpc.on('respond')](#krpconrespond)
  * [krpc.on('{transId}')](#krpcontransid)
  * [krpc.on('error')](#krpconerror)


#### KRPC (constructor)

``` js
krpc = new KRPC([opts])
```

Create a new `krpc` instance.

If `opts` is specified, then the default options (shown below) will be overridden.

``` js
var KRPC = require('krpc');

var krpc = new KRPC({
  transIdBytes: 2,     // transaction id string length
  queryTimeout: 2000   // in milliseconds, maximum time to wait for response
});
```


#### KRPC.Errors

KRPC default error codes:

``` js
KRPC.Errors = {
	GENERIC:         201,
	SERVER:          202,
	PROTOCOL:        203,
	METHOD_UNKNOWN:  204
};
```


#### KRPC.ForeignError

``` js
err = new KRPC.ForeignError(caughtError);
```

An `Error` class for foreign errors that caught while parsing messages.

``` js
socket.on('message', function(buffer, rinfo) {
	try {
		krpc.parse(buffer, rinfo.address, rinfo.port);
	} catch(err) {
		if(err instanceof KRPC.ForeignError)
			throw err.error;

		// else, ignore errors
	}
});
```


#### krpc.parse

``` js
krpc.parse(buffer, ip, port);
```

Parse a massage. See events section for handling parsed messages.
Returns the parsed message. Throws an `Error` on failure or `ForeignError` when
some emit throws an error.

``` js
socket.on('message', function(buffer, rinfo) {
	try {
		krpc.parse(buffer, rinfo.address, rinfo.port);
	} catch(err) {
		if(err instanceof KRPC.ForeignError)
			throw err.error;

		// else, ignore errors
	}
});
```


#### krpc.genTransId

``` js
transId = krpc.genTransId([ip], [port], callback, [timeout]);
```

Returns a new transaction id as `Buffer`.

`callback(err, res)` will be called when a parsed message with that transaction 
id will parse within the query timeout. If no message received within timeout 
a callback with an `err` will be called.

If `ip` or `port` are not `null` callback would be called only if the message 
received form that ip and port.

You may set `timeout` and change the default timeout `queryTimeout` that given 
on the constructor. Set `timeout` to `null` will disable the timeout for this 
transaction.

``` js
var transId = krpc.genTransId('1.1.1.1', 20000, function(err, res) {
	if(err) return console.trace(err);

	console.log(res);
});
```


#### krpc.query
``` js
buffer = krpc.query(transId, type, query);
```

Create an query message with type `type` and the query data `query`. Returns the
message as `Buffer`.

`transId` is the query transaction id.

``` js
var buffer = krpc.query(transId, 'ping', {id: 'abcdefghij0123456789'});
socket.send(buffer, 0, buffer.length, 20000, '1.1.1.1');
```


#### krpc.respond

``` js
buffer = krpc.respond(transId, res);
```

Create a respond message with the data `res`. Returns the
message as `Buffer`.

`transId` is the query transaction id.

``` js
krpc.on('query_ping', function(query, transId, ip, port) {
	console.log(query.id);

	var buffer = krpc.respond(transId, {id: 'mnopqrstuvwxyz123456'});
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


#### krpc.error

``` js
buffer = krpc.error(transId, errorCode, errorMsg)
```

Create an error message with the code `errorCode` and message `errorMsg`. Returns the
message as `Buffer`.

`transId` is the query transaction id.

``` js
krpc.on('parseError', function(transId, errorMsg, ip, port) {
	var buffer = krpc.error(transId, KRPC.Errors.PROTOCOL, errorMsg);
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


#### krpc.on('parseError')

``` js
krpc.on('parseError', function(transId, errorMsg, ip, port) { ... })
```

Emits when a parse error should send back to the querying node.

``` js
krpc.on('parseError', function(transId, errorMsg, ip, port) {
	var buffer = krpc.error(transId, KRPC.Errors.PROTOCOL, errorMsg);
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


#### krpc.on('query')

``` js
krpc.on('query', function(type, query, transId, ip, port) { ... })
```

Emits for each parsed query message.


#### krpc.on('query_{type}')

``` js
krpc.on('query_{type}', function(query, transId, ip, port) { ... })
```

Emits for each parsed query message with type `{type}`.

``` js
krpc.on('query_ping', function(query, transId, ip, port) {
	console.log(query.id);

	var buffer = krpc.respond(transId, {id: 'mnopqrstuvwxyz123456'});
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


#### krpc.on('respond')

``` js
krpc.on('respond', function(res, transId, ip, port) { ... })
```

Emits for each parsed respond message.


#### krpc.on('{transId}')

``` js
krpc.on('{transId}', function(err, ip, port, res) { ... })
```

Emits for each parsed respond or error message with transaction id `{transId}` has hex string.


#### krpc.on('error')

``` js
krpc.on('error', function(errorCode, errorMsg, transId, ip, port) { ... })
```

Emits for each parsed error message.




## License

KRPC.js is freely distributable under the terms of the MIT license.

Copyright (c) Moshe Simantov