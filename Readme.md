[KRPC.js](https://npmjs.org/package/krpc)
==========

Simple KRPC protocol implementaion of bencoded messages.
See [BitTorent DHT spec.](http://www.bittorrent.org/beps/bep_0005.html) for more details


## Install

	$ npm install krpc



## API


#### `krpc = new KRPC([opts])`

Create a new `krpc` instance.

If `opts` is specified, then the default options (shown below) will be overridden.

``` js
var KRPC = require('krpc');

var krpc = new KRPC({
  transBytes: 2,   // transaction id string length
  queryTimeout: 2000 // in milliseconds, maximum time to wait for response
});
```


#### `krpc.parse(buffer, ip, port)`

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


#### `transId = krpc.genTransId(ip, port, callback)`

Returns a new transaction id string.

`callback(err, res)` will be called when a parsed message with that transaction 
id will parse.

If `ip` or `port` are not `null` callback would be called only if the message 
received form that ip and port.

``` js
var transId = krpc.genTransId('1.1.1.1', 20000, function(err, res) {
	if(err) return console.trace(err);

	console.log(res);
});
```


### `buffer = krpc.query(transId, type, query)`

Create an query message with type `type` and the query data `query`. Returns the
message as `Buffer`.

`transId` is the query transaction id.

``` js
var buffer = krpc.query(transId, 'ping', {id: 'abcdefghij0123456789'});
socket.send(buffer, 0, buffer.length, 20000, '1.1.1.1');
```


### `buffer = krpc.respond(transId, res)`

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


### `buffer = krpc.error(transId, errorCode, errorMsg)`

Create an error message with the code `errorCode` and message `errorMsg`. Returns the
message as `Buffer`.

`transId` is the query transaction id.

``` js
krpc.on('parseError', function(transId, errorMsg, ip, port) {
	var buffer = krpc.error(transId, krpc.Errors.PROTOCOL, errorMsg);
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


## Events

### `krpc.on('parseError', function(errorMsg, ip, port) { ... })`

Emits when a parse error should send back to the querying node.

``` js
krpc.on('parseError', function(transId, errorMsg, ip, port) {
	var buffer = krpc.error(transId, krpc.Errors.PROTOCOL, errorMsg);
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


### `krpc.on('query', function(type, query, transId, ip, port) { ... })`

Emits of each parsed query message.


### `krpc.on('query_{type}', function(query, transId, ip, port) { ... })`

Emits of each parsed query message with type `{type}`.

``` js
krpc.on('query_ping', function(query, transId, ip, port) {
	console.log(query.id);

	var buffer = krpc.respond(transId, {id: 'mnopqrstuvwxyz123456'});
	socket.send(buffer, 0, buffer.length, port, ip);
});
```


### `krpc.on('respond', function(res, transId, ip, port) { ... })`

Emits of each parsed respond message.


### `krpc.on('{transId}', function(err, ip, port, res) { ... })`

Emits of any parsed respond or error message with transaction id `{transId}`.


### `krpc.on('error', function(errorCode, errorMsg, transId, ip, port) { ... })`

Emits of each parsed error message.




### License

KRPC.js is freely distributable under the terms of the MIT license.

Copyright (c) 2015 Moshe Simantov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.