var expect = require("expect.js");
var couchdb = require("./mock");
var mockFile = couchdb.file("document");
var Server = require("../lib/server");
var Document = require("../lib/document");
var CouchError = require("../lib/coucherror");

var srv = new Server();
var db = srv.db("test-db");


describe("Document(db, id, rev)", function () {
    it("should be a function", function () {
        expect(Document).to.be.a("function");
    });

    it("should not require the new keyword", function () {
        var doc = Document(db, "test");
        expect(doc).to.be.ok();
    });

    it("should set the server property", function () {
        var doc = new Document(db, "test");
        expect(doc.server).to.equal(srv);
    });

    it("should set the database property", function () {
        var doc = new Document(db, "test");
        expect(doc.database).to.equal(db);
    });

    it("should set the id if a string", function () {
        var doc = new Document(db, "test");
        expect(doc.id()).to.equal("test");
    });

    it("should set the rev property when passed", function () {
        var doc = new Document(db, "foo", "bar");
        expect(doc.id()).to.equal("foo");
        expect(doc.rev()).to.equal("bar");
    });

    it("should set the body when an object", function () {
        var doc = new Document(db, { foo: "bar" });
        expect(doc._body).to.eql({ foo: "bar" });
    });
});

describe("Document#id(id)", function () {
    var doc = new Document(db);

    it("should set _body._id", function () {
        doc.id("test");
        expect(doc._body._id).to.equal("test");
    });

    it("should be chainable", function () {
        expect(doc.id("test")).to.equal(doc);
    });
});

describe("Document#rev(rev)", function () {
    var doc = new Document(db);

    it("should set _body._rev", function () {
        doc.rev("test");
        expect(doc._body._rev).to.equal("test");
    });

    it("should be chainable", function () {
        expect(doc.rev("test")).to.equal(doc);
    });
});

describe("Document#url(path)", function () {
    var doc = db.doc("test-doc");

    it("should return the correct url", function () {
        expect(doc.url()).to.equal("http://localhost:5984/test-db/test-doc");
    });

    it("should append additional path info", function () {
        expect(doc.url("attachment")).to.equal("http://localhost:5984/test-db/test-doc/attachment");
    });

    it("should work correctly when an array is passed", function () {
        expect(doc.url([ "attachment", "subfolder" ])).to.equal("http://localhost:5984/test-db/test-doc/attachment/subfolder");
    });
});

describe("Document#body(body)", function () {
    it("should set the _body property", function () {
        var doc = db.doc("test").body({ foo: "bar" });
        expect(doc._body.foo).to.equal("bar");
    });

    it("should return the document object", function () {
        var doc = db.doc("test");
        expect(doc.body({})).to.equal(doc);
    });

    it("should overwrite the id and rev properties when included", function () {
        var doc = db.doc("test").body({ _id: "a", _rev: "b" });
        expect(doc.id()).to.equal("a");
        expect(doc.rev()).to.equal("b");
    });

    it("should remove the id and rev properties when left out", function () {
        var doc = db.doc("test").body({});
        expect(doc.id()).to.not.be.ok();
        expect(doc.rev()).to.not.be.ok();
    });

    it("should be chainable", function () {
        var doc = db.doc("test");
        expect(doc.body({})).to.equal(doc);
    });
});

describe("Document#extend(body)", function () {
    it("should augment the body", function () {
        var doc = db.doc("test", "rev").extend({ foo: "bar" });
        expect(doc.body()).to.eql({
            _id: "test",
            _rev: "rev",
            foo: "bar"
        });
    });

    it("should be chainable", function () {
        var doc = db.doc("test");
        expect(doc.extend({ foo: "bar" })).to.equal(doc);
    });
});

describe("Document#empty()", function () {
    it("should remove everything but _id and _rev", function () {
        var doc = db.doc("test", "rev").extend({ foo: "bar" }).empty();
        expect(doc._body).to.eql({ _id: "test", _rev: "rev" });
    });

    it("should be chainable", function () {
        var doc = db.doc("test");
        expect(doc.empty()).to.equal(doc);
    });
});

describe("Document#exists(callback)", function () {
    var doc = db.doc("test-doc");

    it("should return any network errors", function (done) {
        couchdb
            .head("/test-db/test-doc")
            .reply(200);

        var req = doc.exists(function (err, exists) {
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
            .head("/test-db/test-doc")
            .reply(200);

        doc.exists(function (err, exists) {
            if (err) return done(err);
            expect(exists).to.equal(true);
            done();
        });
    });

    it("should return false when it does not exist", function (done) {
        couchdb
            .head("/test-db/test-doc")
            .reply(404);

        doc.exists(function (err, exists) {
            if (err) return done(err);
            expect(exists).to.equal(false);
            done();
        });
    });

    it("should return other couchdb errors", function (done) {
        couchdb
            .head("/test-db/test-doc")
            .reply(500, {
                error: "internal_error",
                reason: "Unknown error"
            });

        doc.exists(function (err, exists) {
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
            .head("/test-db/test-doc")
            .reply(500, "superfail");

        doc.exists(function (err, exists) {
            expect(err).to.be.an(Error);
            expect(err.message).to.equal("unknown error");
            expect(exists).to.be.an("undefined");
            done();
        });
    });

    it("should preserve the document as the context of the callback", function (done) {
        couchdb
            .head("/test-db/test-doc")
            .reply(200);

        doc.exists(function (err) {
            if (err) return done(err);
            expect(this).to.equal(doc);
            done();
        });
    });
});

describe("Document#get(callback)", function () {
    var db = srv.db("recipes");

    it("should return the document body", function (done) {
        couchdb
            .get("/recipes/SpaghettiWithMeatballs")
            .replyWithFile(200, mockFile("get.json"));

        db.doc("SpaghettiWithMeatballs").get(function (err, body) {
            if (err) return done(err);
            expect(body._id).to.equal("SpaghettiWithMeatballs");
            expect(body.name).to.equal("Spaghetti with meatballs");
            done();
        });
    });

    it("should preserve the document as the context in the callback", function (done) {
        var doc = db.doc("SpaghettiWithMeatballs");

        couchdb
            .get("/recipes/SpaghettiWithMeatballs")
            .replyWithFile(200, mockFile("get.json"));

        doc.get(function (err) {
            if (err) return done(err);
            expect(this).to.equal(doc);
            done();
        });
    });

    it("should save the document body as a property", function (done) {
        couchdb
            .get("/recipes/SpaghettiWithMeatballs")
            .replyWithFile(200, mockFile("get.json"));

        db.doc("SpaghettiWithMeatballs").get(function (err, body) {
            if (err) return done(err);
            expect(this._body).to.equal(body);
            done();
        });
    });

    it("should return a CouchError to the callback", function (done) {
        couchdb
            .get("/recipes/does-not-exist")
            .reply(404, {
                error: "not_found",
                reason: "missing"
            });

        db.doc("does-not-exist").get(function (err, body) {
            expect(err).to.be.a(CouchError);
            done();
        });
    });
});

describe("Document#save(callback)", function () {
    var db = srv.db("recipes");

    it("should use PUT when document has an id", function (done) {
        couchdb
            .put("/recipes/SpaghettiWithMeatballs")
            .replyWithFile(201, mockFile("create.json"));

        var doc = db.doc({
            _id: "SpaghettiWithMeatballs",
            description: "An Italian-American dish that usually consists of spaghetti, tomato sauce and meatballs.",
            ingredients: [
                "spaghetti",
                "tomato sauce",
                "meatballs"
            ],
            name: "Spaghetti with meatballs"
        });

        doc.save(function (err, result) {
            if (err) return done(err);
            expect(result).to.eql({
                id: "SpaghettiWithMeatballs",
                ok: true,
                rev: "1-917fa2381192822767f010b95b45325b"
            });
            done();
        });
    });

    it("should use POST when document has no id", function (done) {
        couchdb
            .post("/recipes")
            .replyWithFile(201, mockFile("create-post.json"));

        var doc = db.doc({
            description: "An Italian-American dish that usually consists of spaghetti, tomato sauce and meatballs.",
            ingredients: [
                "spaghetti",
                "tomato sauce",
                "meatballs"
            ],
            name: "Spaghetti with meatballs"
        });

        doc.save(function (err, result) {
            if (err) return done(err);
            expect(result).to.eql({
                id: "217e0af0fe696a082b4ead4f6f00068e",
                ok: true,
                rev: "1-917fa2381192822767f010b95b45325b"
            });
            done();
        });
    });

    it("should send the document body in the request", function (done) {
        couchdb
            .post("/recipes", { foo: "bar" })
            .reply(201, "Success");

        db.doc({ foo: "bar" }).save(done);
    });

    it("should preserve the context as the document in the callback", function (done) {
        couchdb
            .post("/recipes")
            .replyWithFile(201, mockFile("create-post.json"));

        var doc = db.doc({ foo: "bar" });
        doc.save(function (err) {
            if (err) return done(err);
            expect(this).to.equal(doc);
            done();
        });
    });

    it("should update the id and rev properties", function (done) {
        couchdb
            .post("/recipes")
            .replyWithFile(201, mockFile("create-post.json"));

        db.doc({ foo: "bar" }).save(function (err) {
            if (err) return done(err);
            expect(this.id()).to.equal("217e0af0fe696a082b4ead4f6f00068e");
            expect(this.rev()).to.equal("1-917fa2381192822767f010b95b45325b");
            done();
        });
    });

    it("should include the rev query param", function (done) {
        couchdb
            .put("/recipes/test-doc?rev=test-rev")
            .reply(201, mockFile("create-post.json"));

        db.doc("test-doc", "test-rev").save(done);
    });
});

describe("Document#destroy(callback)", function () {
    var db = srv.db("recipes");

    it("should use a DELETE request", function (done) {
        couchdb
            .delete("/recipes/FishStew?rev=1-9c65296036141e575d32ba9c034dd3ee")
            .replyWithFile(200, mockFile("delete.json"));

        var doc = db.doc("FishStew", "1-9c65296036141e575d32ba9c034dd3ee");

        doc.destroy(function (err, result) {
            if (err) return done(err);
            expect(result).to.eql({
                id: "FishStew",
                ok: true,
                rev: "2-056f5f44046ecafc08a2bc2b9c229e20"
            });
            done();
        });
    });

    it("should update the rev property", function (done) {
        couchdb
            .delete("/recipes/FishStew?rev=1-9c65296036141e575d32ba9c034dd3ee")
            .replyWithFile(200, mockFile("delete.json"));

        var doc = db.doc("FishStew", "1-9c65296036141e575d32ba9c034dd3ee");

        doc.destroy(function (err) {
            if (err) return done(err);
            expect(doc.rev()).to.equal("2-056f5f44046ecafc08a2bc2b9c229e20");
            done();
        });
    });

    it("should preserve the document as the context of the callback", function (done) {
        couchdb
            .delete("/recipes/FishStew?rev=1-9c65296036141e575d32ba9c034dd3ee")
            .replyWithFile(200, mockFile("delete.json"));

        var doc = db.doc("FishStew", "1-9c65296036141e575d32ba9c034dd3ee");

        doc.destroy(function (err) {
            if (err) return done(err);
            expect(this).to.equal(doc);
            done();
        });
    });

    it("should return a CouchError to the callback", function (done) {
        couchdb
            .delete("/recipes/test-doc?rev=test-rev")
            .reply(404, {
                error: "not_found",
                reason: "missing"
            });

        db.doc("test-doc", "test-rev").destroy(function (err) {
            expect(err).to.be.a(CouchError);
            done();
        });
    });
});

describe("Document#show(name, body, callback)", function () {
    it("should call the show handler for this document", function (done) {
        couchdb
            .post("/test-db/_design/ddoc/_show/showfn")
            .reply(200, "Hello World", {
                "Content-Type": "text/plain"
            });

        db.doc().show("ddoc/showfn", function (err, results) {
            if (err) return done(err);
            expect(results).to.equal("Hello World");
            done();
        });
    });

    it("should include a request body", function (done) {
        couchdb
            .post("/test-db/_design/ddoc/_show/showfn", {
                hello: "world"
            })
            .reply(200);

        db.doc().show("ddoc/showfn", { hello: "world" }, done);
    });

    it("should use put when a document id is present", function (done) {
        couchdb
            .put("/test-db/_design/ddoc/_show/showfn/doc")
            .reply(200);

        db.doc("doc").show("ddoc/showfn", done);
    });

    it("should preserve the document as the context of the callback", function (done) {
        couchdb
            .post("/test-db/_design/ddoc/_show/showfn")
            .reply(200);

        var doc = db.doc();

        doc.show("ddoc/showfn", function (err, results) {
            if (err) return done(err);
            expect(this).to.equal(doc);
            done();
        });
    });
});

describe("Document#update(name, body, callback)", function () {
    it("should call the update handler for this document", function (done) {
        couchdb
            .post("/test-db/_design/ddoc/_update/updatefn")
            .reply(200, "Hello World", {
                "Content-Type": "text/plain"
            });

        db.doc().update("ddoc/updatefn", function (err, results) {
            if (err) return done(err);
            expect(results).to.equal("Hello World");
            done();
        });
    });

    it("should include a request body", function (done) {
        couchdb
            .post("/test-db/_design/ddoc/_update/updatefn", {
                hello: "world"
            })
            .reply(200);

        db.doc().update("ddoc/updatefn", { hello: "world" }, done);
    });

    it("should use put when a document id is present", function (done) {
        couchdb
            .put("/test-db/_design/ddoc/_update/updatefn/doc")
            .reply(200);

        db.doc("doc").update("ddoc/updatefn", done);
    });

    it("should preserve the document as the context of the callback", function (done) {
        couchdb
            .post("/test-db/_design/ddoc/_update/updatefn")
            .reply(200);

        var doc = db.doc();

        doc.update("ddoc/updatefn", function (err, results) {
            if (err) return done(err);
            expect(this).to.equal(doc);
            done();
        });
    });
});

describe("Document#serialize(input)", function () {
    var fn = Document.prototype.serialize;

    it("should return a JSON string", function () {
        expect(fn({})).to.equal("{}");
        expect(fn({ hello: "world" })).to.equal("{\"hello\":\"world\"}");
        expect(fn({ foo: null })).to.equal("{\"foo\":null}");
    });

    it("should convert functions to strings", function () {
        var noop = function () {};
        expect(fn({ noop: noop })).to.equal("{\"noop\":\"function () {}\"}");
    });
});
