KRPC.js
==========

[![build](https://img.shields.io/travis/DevelopmentIL/krpc.svg)](https://travis-ci.org/DevelopmentIL/krpc)
[![npm](https://img.shields.io/npm/v/krpc.svg)](https://npmjs.org/package/krpc)
[![npm](https://img.shields.io/npm/dm/krpc.svg)](https://npmjs.org/package/krpc)
[![npm](https://img.shields.io/npm/l/krpc.svg)](https://github.com/DevelopmentIL/krpc/blob/master/LICENSE)

Simple KRPC protocol implementaion of bencoded messages.
See [BitTorent DHT specifications](http://www.bittorrent.org/beps/bep_0005.html) for more details


## Install

	$ npm install krpc



## API
  * [KRPC (constructor)](#krpc-constructor)
  * [KRPC.Errors](#krpcerrors)
  * [KRPC.parse](#krpcparse)
  * [KRPC.genTransId](#krpcgenTransId)
  * [KRPC.query](#krpcquery)
  * [KRPC.respond](#krpcrespond)
  * [KRPC.error](#krpcerror)
  * [KRPC.on('parseError')](#krpconparseerror)
  * [KRPC.on('query')](#krpconquery)
  * [KRPC.on('query_{type}')](#krpconquery_type)
  * [KRPC.on('respond')](#krpconrespond)
  * [KRPC.on('{transId}')](#krpcontransid)
  * [KRPC.on('error')](#krpconerror)


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


#### KRPC.parse

``` js
krpc.parse(buffer, ip, port);
```

Parse a massage. See events section for handling parsed messages.
Returns the parsed message. Throws an error on failure.

``` js
socket.on('message', function(buffer, rinfo) {
	try {
		krpc.parse(buffer, rinfo.address, rinfo.port);
	} catch(err) {
		// ignore errors
	}
});
```


#### KRPC.genTransId

``` js
transId = krpc.genTransId([ip], [port], callback, [timeout]);
```

Returns a new transaction id as buffer.

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


### KRPC.query
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


### KRPC.respond

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


### KRPC.error

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


### KRPC.on('parseError')

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


### KRPC.on('query')

``` js
krpc.on('query', function(type, query, transId, ip, port) { ... })
```

Emits for each parsed query message.


### KRPC.on('query_{type}')

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


### KRPC.on('respond')

``` js
krpc.on('respond', function(res, transId, ip, port) { ... })
```

Emits for each parsed respond message.


### KRPC.on('{transId}')

``` js
krpc.on('{transId}', function(err, ip, port, res) { ... })
```

Emits for each parsed respond or error message with transaction id `{transId}` has hex string.


### KRPC.on('error')

``` js
krpc.on('error', function(errorCode, errorMsg, transId, ip, port) { ... })
```

Emits for each parsed error message.




### License

KRPC.js is freely distributable under the terms of the MIT license.

Copyright (c) Moshe Simantov