var expect = require("expect.js");
var couchdb = require("./mock");
var mockFile = couchdb.file("database");
var Server = require("../lib/server");
var Database = require("../lib/database");
var Document = require("../lib/document");
var DesignDocument = require("../lib/design-document");
var LocalDocument = require("../lib/local-document");
var CouchError = require("../lib/coucherror");

var srv = new Server();

describe("Database API", function () {
    describe("Database(name)", function () {
        it("should be a function", function () {
            expect(Database).to.be.a("function");
        });

        it("should set the server property", function () {
            var db = new Database(srv, "test");
            expect(db.server).to.equal(srv);
        });

        it("should set the name property", function () {
            var db = new Database(srv, "test");
            expect(db.name).to.equal("test");
        });

        it("should not require the new keyword", function () {
            var db = Database(srv, "test");
            expect(db).to.be.ok();
        });
    });

    describe("Database#url(path)", function () {
        var db = srv.db("test");

        it("should return the correct url", function () {
            expect(db.url()).to.equal("http://localhost:5984/test");
        });

        it("should append additional path info", function () {
            expect(db.url("_session")).to.equal("http://localhost:5984/test/_session");
        });

        it("should work correctly when an array is passed", function () {
            expect(db.url([ "_config", "log", "level" ])).to.equal("http://localhost:5984/test/_config/log/level");
        });
    });

    describe("Database#exists(callback)", function () {
        var db = srv.db("test");

        it("should return any network errors", function (done) {
            couchdb
                .head("/test")
                .reply(200);

            var req = db.exists(function (err, exists) {
                expect(err).to.be.an(Error);
                expect(exists).to.be.an("undefined");
                done();
            });

            // this is the only way to simulate a random network error atm, until pgte/nock#164 is addressed
            // @see https://github.com/pgte/nock/issues/164
            req.abort();
            req.callback(new Error("simulated network failure"));
        });

        it("should return true when exists", function (done) {
            couchdb
                .head("/test")
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            db.exists(function (err, exists) {
                if (err) return done(err);
                expect(exists).to.equal(true);
                done();
            });
        });

        it("should return false when it does not exist", function (done) {
            couchdb
                .head("/test")
                .reply(404, {
                    "Content-Type": "text/plain"
                });

            db.exists(function (err, exists) {
                if (err) return done(err);
                expect(exists).to.equal(false);
                done();
            });
        });

        it("should return other couchdb errors", function (done) {
            couchdb
                .head("/test")
                .reply(500, {
                    error: "internal_error",
                    reason: "Unknown error"
                });

            db.exists(function (err, exists) {
                expect(err).to.be.a(CouchError);
                expect(exists).to.be.an("undefined");
                done();
            });
        });

        it("should give an unknown error (100% coverage ftw)", function (done) {
            // This test is only here to give us 100% test coverage
            // According to the CouchDB documentation, the conditions I've tested for with my if and else-if
            // should be sufficient. Just in case, I've added the else (hence the test below)
            couchdb
                .head("/test")
                .reply(500, "superfail", {
                    "Content-Type": "text/plain"
                });

            db.exists(function (err, exists) {
                expect(err).to.be.an(Error);
                expect(err.message).to.equal("unknown error");
                expect(exists).to.be.an("undefined");
                done();
            });
        });

        it("should preserve the database as the context of the callback", function (done) {
            couchdb
                .head("/test")
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            db.exists(function (err) {
                if (err) return done(err);
                expect(this).to.equal(db);
                done();
            });
        });
    });

    describe("Database#info(callback)", function () {
        var db = srv.db("receipts");

        it("should return database information", function (done) {
            couchdb
                .get("/receipts")
                .replyWithFile(200, mockFile("info.json"));

            db.info(function (err, info) {
                if (err) return done(err);
                expect(info.db_name).to.equal("receipts");
                done();
            });
        });

        it("should preserve the database as the context of the callback", function (done) {
            couchdb
                .get("/receipts")
                .replyWithFile(200, mockFile("info.json"));

            db.info(function (err) {
                if (err) return done(err);
                expect(this).to.equal(db);
                done();
            });
        });
    });

    describe("Database#create(callback)", function () {
        var db = srv.db("test");

        it("should create the new database", function (done) {
            couchdb
                .put("/test")
                .reply(201, { ok: true }, {
                    Location: db.url()
                });

            db.create(done);
        });

        it("should preserve the database as the context of the callback", function (done) {
            couchdb
                .put("/test")
                .reply(201, {
                    "Content-Type": "text/plain"
                });

            db.create(function (err) {
                if (err) return done(err);
                expect(this).to.equal(db);
                done();
            });
        });
    });

    describe("Database#destroy(callback)", function () {
        var db = srv.db("test");

        it("should delete the database", function (done) {
            couchdb
                .delete("/test")
                .reply(200, { ok: true });

            db.destroy(done);
        });

        it("should preserve the database as the context of the callback", function (done) {
            couchdb
                .delete("/test")
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            db.destroy(function (err) {
                if (err) return done(err);
                expect(this).to.equal(db);
                done();
            });
        });
    });

    describe("Database#doc(id, [rev])", function () {
        var db = srv.db("test");

        it("should return a Document instance", function () {
            var doc = db.doc("doc");
            expect(doc).to.be.a(Document);
        });

        it("should have the database set correctly", function () {
            var doc = db.doc("doc");
            expect(doc.database).to.equal(db);
        });

        it("should set the id and rev correctly", function () {
            var doc = db.doc("id", "rev");
            expect(doc.id()).to.equal("id");
            expect(doc.rev()).to.equal("rev");
        });
    });

    describe("Database#ddoc(id, [rev])", function () {
        var db = srv.db("test");

        it("should return a DesignDocument instance", function () {
            var doc = db.ddoc("ddoc");
            expect(doc).to.be.a(DesignDocument);
        });

        it("should have the database set correctly", function () {
            var doc = db.ddoc("ddoc");
            expect(doc.database).to.equal(db);
        });

        it("should set the id and rev correctly", function () {
            var doc = db.ddoc("id", "rev");
            expect(doc.id()).to.equal("_design/id");
            expect(doc.rev()).to.equal("rev");
        });
    });

    describe("Database#ldoc(id, [rev])", function () {
        var db = srv.db("test");

        it("should return a LocalDocument instance", function () {
            var doc = db.ldoc("ldoc");
            expect(doc).to.be.a(LocalDocument);
        });

        it("should have the database set correctly", function () {
            var doc = db.ldoc("ldoc");
            expect(doc.database).to.equal(db);
        });

        it("should set the id and rev correctly", function () {
            var doc = db.ldoc("id", "rev");
            expect(doc.id()).to.equal("_local/id");
            expect(doc.rev()).to.equal("rev");
        });
    });
});
