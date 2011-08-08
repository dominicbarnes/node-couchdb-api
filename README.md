# node-couchdb-api

This [node.js](http://nodejs.org/) module aims to provide a clean, asynchronous wrapper for the [CouchDB](http://couchdb.apache.org/) API.

It uses callbacks that follow node.js conventions and aims to be as expressive as possible.

## Installation

`$ npm install couchdb-api`

## Usage

    var couchdb = require("couchdb-api");

    // connect to a couchdb server (defaults to localhost:5984)
    var server = couchdb.srv();

    // test it out!
    server.info(function (err, response) {
		console.log(response);

		// should get `{ couchdb: "Welcome", version: "1.0.1" }
		// if something went wrong, the `err` argument would provide the error that CouchDB provides
    });

    // select a database
    var db = server.db("my-database");

    db.info(function (err, response) {
		console.log(response);

		// should see the basic statistics for your test database
		// if you chose a non-existant db, you'd get { error: "not_found", reason: "no_db_file" } in place of `err`
    });

Refer to [my website](http://dominicbarnes.us/node-couchdb-api/) for documentation and resources.
