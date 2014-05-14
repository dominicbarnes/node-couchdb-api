var expect = require("expect.js");
var couchdb = require("./mock");
var mockFile = couchdb.file("view");
var Server = require("../lib/server");
var View = require("../lib/view");

var srv = new Server();
var db = srv.db("test-db");
var ddoc = db.ddoc("test-ddoc");


describe("View(ddoc, name)", function () {
    it("should set the name property", function () {
        var view = new View(ddoc, "test-view");
        expect(view.name).to.equal("test-view");
    });

    it("should set the ddoc property", function () {
        var view = new View(ddoc, "test-view");
        expect(view.ddoc).to.equal(ddoc);
    });

    it("should set the database property", function () {
        var view = new View(ddoc, "test-view");
        expect(view.database).to.equal(db);
    });

    it("should set the server property", function () {
        var view = new View(ddoc, "test-view");
        expect(view.server).to.equal(srv);
    });

    it("should set the client property", function () {
        var view = new View(ddoc, "test-view");
        expect(view.client).to.equal(srv.client);
    });

    it("should not require the new keyword", function () {
        var view = View(ddoc, "test-view");
        expect(view).to.be.a(View);
    });
});

describe("View#url()", function () {
    var view = ddoc.view("test-view");

    it("should generate the correct URL", function () {
        expect(view.url()).to.equal("http://localhost:5984/test-db/_design/test-ddoc/_view/test-view");
    });
});

describe("View#query([params], callback)", function () {
    var view = ddoc.view("test-view");

    it("should query the configured view", function (done) {
        couchdb
            .get("/test-db/_design/test-ddoc/_view/test-view")
            .replyWithFile(200, mockFile("query.json"));

        view.query(function (err, results) {
            if (err) return done(err);
            expect(results.offset).to.equal(0);
            expect(results.rows.length).to.equal(3);
            expect(results.total_rows).to.equal(3);
            done();
        });
    });

    it("should query for specific keys", function (done) {
        var params = {
            keys: [ "meatballs", "spaghetti" ]
        };

        couchdb
            .post("/test-db/_design/test-ddoc/_view/test-view", params)
            .replyWithFile(200, mockFile("query-keys.json"));

        view.query(params, function (err, results) {
            if (err) return done(err);
            expect(results.offset).to.equal(0);
            expect(results.rows.length).to.equal(2);
            expect(results.total_rows).to.equal(3);
            done();
        });
    });

    it("should query the configured view with additional params", function (done) {
        var params = {
            limit: 1
        };

        couchdb
            .get("/test-db/_design/test-ddoc/_view/test-view?limit=1")
            .replyWithFile(200, mockFile("query-params.json"));

        view.query(params, function (err, results) {
            if (err) return done(err);
            expect(results.offset).to.equal(0);
            expect(results.rows.length).to.equal(1);
            expect(results.total_rows).to.equal(3);
            done();
        });
    });
});

describe("View.normalize(query)", function () {
    var fn = View.normalize;

    it("should return an empty object when an empty value is passed", function () {
        expect(fn()).to.eql({});
    });

    it("should encode specific params as JSON", function () {
        var start = [ "some-key" ];
        var end = [ "some-key", {} ];

        var query = fn({
            startkey: start,
            endkey: end
        });

        expect(query).to.eql({
            startkey: JSON.stringify(start),
            endkey: JSON.stringify(end)
        });
    });

    it("should encode boolean fields as strings", function () {
        var query = fn({
            limit: 1,
            descending: true,
            reduce: false
        });

        expect(query).to.eql({
            limit: 1,
            descending: "true",
            reduce: "false"
        });
    });
});
