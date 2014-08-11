# node-couchdb-api

This [node.js](http://nodejs.org/) module aims to provide an expressive and comprehensive
wrapper for the [CouchDB](http://couchdb.apache.org/) API.

## Installation

```bash
npm install couchdb-api
```

## Usage

The `couchdb-api` export is a function that takes a URL as it's only parameter. Typically, you will pass your server's
base URL as the parameter. (or leave it out if you're just using the default: "http://localhost:5984")

```js
var couchdb = require("couchdb-api");

var srv = couchdb();
// Server(http://localhost:5984/)

var srv = couchdb("https://dominicbarnes.iriscouch.com:5984/");
// Server(https://dominicbarnes.iriscouch.com:5984/)
```

**ProTip:** If you include some additional path information, it is assumed that you are wanting to
connect directly to a database. (and returns a `Database` object accordingly, it's just a little helper)

```js
var db = couchdb("_users");
// identical to: couchdb().db("_users")

var db = couchdb("https://dominicbarnes.iriscouch.com:5984/my-db");
// identical to: couchdb("https://dominicbarnes.iriscouch.com:5984/").db("my-db")
```

Check out the [wiki](http://github.com/dominicbarnes/node-couchdb-api/wiki) for complete API documentation.
