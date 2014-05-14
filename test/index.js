var expect = require("expect.js");
var couchdb = require("..");
var Server = require("../lib/server");

describe("node-couchdb-api", function () {
    it("should be a function", function () {
        expect(couchdb).to.be.a("function");
    });

    it("should return a server instance", function () {
        var srv = couchdb("http://localhost:5984/");
        expect(srv).to.be.a(Server);
    });
});
