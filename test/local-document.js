var expect = require("expect.js");
var Server = require("../lib/server");
var Document = require("../lib/document");
var LocalDocument = require("../lib/local-document");

var srv = new Server();
var db = srv.db("test-db");


describe("Local Document API", function () {
    describe("LocalDocument(db, id, rev)", function () {
        it("should be a function", function () {
            expect(LocalDocument).to.be.a("function");
        });

        it("should inherit from Document", function () {
            var doc = LocalDocument(db, "test");
            expect(doc).to.be.a(Document);
        });

        it("should not require the new keyword", function () {
            var doc = LocalDocument(db, "test");
            expect(doc).to.be.a(LocalDocument);
        });

        it("should set the server property", function () {
            var doc = new LocalDocument(db, "test");
            expect(doc.server).to.equal(srv);
        });

        it("should set the database property", function () {
            var doc = new LocalDocument(db, "test");
            expect(doc.database).to.equal(db);
        });

        it("should set the id if a string", function () {
            var doc = new LocalDocument(db, "test");
            expect(doc.id()).to.equal("_local/test");
        });

        it("should set the rev when passed", function () {
            var doc = new LocalDocument(db, "foo", "bar");
            expect(doc.id()).to.equal("_local/foo");
            expect(doc.rev()).to.equal("bar");
        });

        it("should set the body when an object", function () {
            var doc = new LocalDocument(db, { foo: "bar" });
            expect(doc._body).to.eql({ foo: "bar" });
        });
    });

    describe("LocalDocument#id([id])", function () {
        var doc = new LocalDocument(db, "test");

        it("should prefix the id with '_local/'", function () {
            doc.id("foo");
            expect(doc.id()).to.equal("_local/foo");
        });
    });
});
