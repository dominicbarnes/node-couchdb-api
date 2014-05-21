var expect = require("expect.js");
var couchdb = require("..");
var Server = require("../lib/server");
var Database = require("../lib/database");

describe("node-couchdb-api", function () {
    it("should be a function", function () {
        expect(couchdb).to.be.a("function");
    });

    it("should return a basic server instance", function () {
        var srv = couchdb();
        expect(srv).to.be.a(Server);
        expect(srv.client.url()).to.equal("http://localhost:5984/");
    });

    it("should return a correct server instance", function () {
        var srv = couchdb("https://user:pass@www.example.com:3000/");
        expect(srv).to.be.a(Server);
        expect(srv.client.url()).to.equal("https://user:pass@www.example.com:3000/");
    });

    it("should return a correct database instance", function () {
        var db = couchdb("https://user:pass@www.example.com:3000/_users");
        expect(db).to.be.a(Database);
        expect(db.name).to.equal("_users");
        expect(db.client).to.equal(db.server.client);
        expect(db.url()).to.equal("https://user:pass@www.example.com:3000/_users");
    });

    it("should return a correct database instance without a full URL", function () {
        var db = couchdb("_users");
        expect(db).to.be.a(Database);
        expect(db.name).to.equal("_users");
        expect(db.client).to.equal(db.server.client);
        expect(db.url()).to.equal("http://localhost:5984/_users");
    });
});
