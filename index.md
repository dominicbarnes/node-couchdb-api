---
layout: default
title: Home
description: node-couchdb-api is a Node.JS wrapper for the CouchDB HTTP API
---

## What is `node-couchdb-api`?

node-couchdb-api is an easy-to-use, powerful wrapper for the CouchDB HTTP API.
It is meant to follow Node.JS conventions for asynchronous code and callbacks,
allowing you to leverage the flexibility of CouchDB in your application with eas.

## What is it not?

This is **not** an ORM for CouchDB, it's simply a JavaScript API to perform
requests against the CouchDB HTTP API easily.

## Getting Started

### Installation

`npm install couchdb-api`

### Usage

    var couchdb = require("couchdb-api");

    var srv = couchdb.srv();

    // GET -> http://localhost:5984/
    srv.info(function (err, response) {
        // err      => null
        // response => { couchdb: "Welcome"; version: "1.0.1" }
    });

    var db = srv.db("my-db");

    // GET -> http://localhost:5984/my-db
    db.info(function (err, response) {
        // err      => null
        // response => { ...db info... }
    });

    var doc = db.doc("my-doc");

    // GET -> http://localhost:5984/my-db/my-doc
    doc.read(function (err, body) {
        // err  => null
        // body => { ...document body... }
    });

## API Objects

 * [Server](/node-couchdb-api/api/server.html)
 * [Database](/node-couchdb-api/api/database.html)
 * [Document](/node-couchdb-api/api/document.html)
 * [Design Document](/node-couchdb-api/api/designdocument.html)
 * [View](/node-couchdb-api/api/view.html)
