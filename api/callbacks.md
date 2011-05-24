---
title: Callbacks
layout: default
---

## Callbacks

Callbacks for every call to the CouchDB API are handled consistently.
The Node.JS pattern of `err`, `data` as arguments is followed, with
the raw `httpResponse` object from the server to occupy the 3rd argument.

{% highlight javascript %}
function myCallback(err, data, response) {
	// err      => `null` OR the CouchDB error object
	// data     => the requested data (or `null` in the case of an error)
	// response => the httpResponse object from the corresponding HTTP request
}
{% endhighlight %}


### Example

{% highlight javascript %}
var server = require("couchdb-api").srv();

// successful request
server.info(function (err, data, response) {
	// err      => null
	// data     => { couchdb: "welcome", version: "1.0.1" }

	// response => [httpResponse Object]
});

var db = server.db("non-existant-database");

// failed request
db.info(function (err, data, response) {
	// err      => { error: "not_found", reason: "no_db_file" }
	// data     => null

	// response => [httpResponse Object]
});
{% endhighlight %}
