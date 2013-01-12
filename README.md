# node-couchdb-api

This [node.js](http://nodejs.org/) module aims to provide a clean, asynchronous wrapper for the [CouchDB](http://couchdb.apache.org/) API.

It uses callbacks that follow node.js conventions and aims to be as expressive as possible.

## Installation

`$ npm install couchdb-api`

## Usage

    var couchdb = require("couchdb-api");

    // connect to a couchdb server (defaults to http://localhost:5984)
    var server = couchdb.srv();

    // test it out!
    server.info(function (err, response) {
	console.log(response);

	// should get { couchdb: "Welcome", version: "1.0.1" }
	// if something went wrong, the `err` argument would provide the error that CouchDB provides
    });

    // select a database
    var db = server.db("my-database");

    db.info(function (err, response) {
	console.log(response);

	// should see the basic statistics for your test database
	// if you chose a non-existant db, you'd get { error: "not_found", reason: "no_db_file" } in place of `err`
    });

Refer to [my website](http://www.dbarnes.info/node-couchdb-api/) for documentation and resources.

## Changelog

**1.2.2**
 * Fixing issues #17, #12 and #11

**1.2.0**
 - Complete documentation rewrite (now generated automatically via source code comments with [dox](https://github.com/visionmedia/dox))
 - Simplified the JSHint config by putting it into a single file at the root
 - Simplified the `index.js` entry-point. `couchdb.srv()` now only takes a single argument, a string URL.


**1.1.5**
 - Changed the package.json to allow for installs on node engine version 8
