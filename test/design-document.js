var expect = require("expect.js");
var noop = require("nop");
var Server = require("../lib/server");
var Document = require("../lib/document");
var DesignDocument = require("../lib/design-document");

var srv = new Server();
var db = srv.db("test-db");


describe("Design Document API", function () {
    describe("DesignDocument(db, id, rev)", function () {
        it("should be a function", function () {
            expect(DesignDocument).to.be.a("function");
        });

        it("should inherit from Document", function () {
            var doc = DesignDocument(db, "test");
            expect(doc).to.be.a(Document);
        });

        it("should not require the new keyword", function () {
            var doc = DesignDocument(db, "test");
            expect(doc).to.be.ok();
            expect(doc).to.be.a(DesignDocument);
        });

        it("should set the server property", function () {
            var doc = new DesignDocument(db, "test");
            expect(doc.server).to.equal(srv);
        });

        it("should set the database property", function () {
            var doc = new DesignDocument(db, "test");
            expect(doc.database).to.equal(db);
        });

        it("should set the id if a string", function () {
            var doc = new DesignDocument(db, "test");
            expect(doc.id()).to.equal("_design/test");
        });

        it("should set the rev when passed", function () {
            var doc = new DesignDocument(db, "foo", "bar");
            expect(doc.id()).to.equal("_design/foo");
            expect(doc.rev()).to.equal("bar");
        });

        it("should set the body when an object", function () {
            var doc = new DesignDocument(db, { foo: "bar" });
            expect(doc._body).to.eql({ foo: "bar" });
        });
    });

    describe("DesignDocument#language(key)", function () {
        it("should set the language property on the body", function () {
            var ddoc = db.ddoc("test");
            ddoc.language("javascript");
            expect(ddoc._body.language).to.equal("javascript");
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.language("javascript")).to.equal(ddoc);
        });
    });

    describe("DesignDocument#options(options)", function () {
        it("should set the options property on the body", function () {
            var ddoc = db.ddoc("test");
            ddoc.options({ some: "options" });
            expect(ddoc._body.options).to.eql({ some: "options" });
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.options()).to.equal(ddoc);
        });
    });

    describe("DesignDocument#filter(name, fn)", function () {
        it("should create the filters property on the body", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc._body.filters).to.not.be.ok();
            ddoc.filter("test", noop);
            expect(ddoc._body.filters).to.be.ok();
        });

        it("should add the filter to the filters object", function () {
            var ddoc = db.ddoc("test");
            ddoc.filter("test", noop);
            expect(ddoc._body.filters.test).to.equal(noop);
        });

        it("should append when called multiple times", function () {
            var ddoc = db.ddoc("test");
            ddoc.filter("test1", noop);
            ddoc.filter("test2", noop);
            expect(ddoc._body.filters).to.have.keys("test1", "test2");
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.filter("test", noop)).to.equal(ddoc);
        });
    });

    describe("DesignDocument#list(name, fn)", function () {
        it("should create the lists property on the body", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc._body.lists).to.not.be.ok();
            ddoc.list("test", noop);
            expect(ddoc._body.lists).to.be.ok();
        });

        it("should add the list to the lists object", function () {
            var ddoc = db.ddoc("test");
            ddoc.list("test", noop);
            expect(ddoc._body.lists.test).to.equal(noop);
        });

        it("should append when called multiple times", function () {
            var ddoc = db.ddoc("test");
            ddoc.list("test1", noop);
            ddoc.list("test2", noop);
            expect(ddoc._body.lists).to.have.keys("test1", "test2");
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.list("test", noop)).to.equal(ddoc);
        });
    });

    describe("DesignDocument#rewrite(rule)", function () {
        it("should create the rewrites property on the body", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc._body.rewrites).to.not.be.ok();
            ddoc.rewrite({ from: "/a", to: "/some" });
            expect(ddoc._body.rewrites).to.be.ok();
        });

        it("should add the rewrite to the rewrites object", function () {
            var ddoc = db.ddoc("test");
            ddoc.rewrite({ from: "/a", to: "/some" });
            expect(ddoc._body.rewrites).to.have.length(1);
            expect(ddoc._body.rewrites[0]).to.eql({ from: "/a", to: "/some" });
        });

        it("should append when called multiple times", function () {
            var ddoc = db.ddoc("test");
            ddoc.rewrite(noop);
            ddoc.rewrite(noop);
            expect(ddoc._body.rewrites).to.have.length(2);
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.rewrite({ from: "/a", to: "/some" })).to.equal(ddoc);
        });
    });

    describe("DesignDocument#show(name, fn)", function () {
        it("should create the shows property on the body", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc._body.shows).to.not.be.ok();
            ddoc.show("test", noop);
            expect(ddoc._body.shows).to.be.ok();
        });

        it("should add the show to the shows object", function () {
            var ddoc = db.ddoc("test");
            ddoc.show("test", noop);
            expect(ddoc._body.shows.test).to.equal(noop);
        });

        it("should append when called multiple times", function () {
            var ddoc = db.ddoc("test");
            ddoc.show("test1", noop);
            ddoc.show("test2", noop);
            expect(ddoc._body.shows).to.have.keys("test1", "test2");
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.show("test", noop)).to.equal(ddoc);
        });
    });

    describe("DesignDocument#update(name, fn)", function () {
        it("should create the updates property on the body", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc._body.updates).to.not.be.ok();
            ddoc.update("test", noop);
            expect(ddoc._body.updates).to.be.ok();
        });

        it("should add the update to the updates object", function () {
            var ddoc = db.ddoc("test");
            ddoc.update("test", noop);
            expect(ddoc._body.updates.test).to.equal(noop);
        });

        it("should append when called multiple times", function () {
            var ddoc = db.ddoc("test");
            ddoc.update("test1", noop);
            ddoc.update("test2", noop);
            expect(ddoc._body.updates).to.have.keys("test1", "test2");
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.update("test", noop)).to.equal(ddoc);
        });
    });

    describe("DesignDocument#validate(fn)", function () {
        it("should set the validate_doc_update property on the body", function () {
            var ddoc = db.ddoc("test");
            ddoc.validate(noop);
            expect(ddoc._body.validate_doc_update).to.equal(noop);
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.validate(noop)).to.equal(ddoc);
        });
    });


    describe("DesignDocument#view(name, map, [reduce])", function () {
        it("should create the views property on the body", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc._body.views).to.not.be.ok();
            ddoc.view("test", noop);
            expect(ddoc._body.views).to.be.ok();
        });

        it("should add the view to the views object", function () {
            var ddoc = db.ddoc("test");
            ddoc.view("test", noop);
            expect(ddoc._body.views.test).to.eql({ map: noop });
        });

        it("should include the reduce property as well", function () {
            var ddoc = db.ddoc("test");
            ddoc.view("test", noop, "_sum");
            expect(ddoc._body.views.test).to.eql({ map: noop, reduce: "_sum" });
        });

        it("should append when called multiple times", function () {
            var ddoc = db.ddoc("test");
            ddoc.view("test1", noop);
            ddoc.view("test2", noop);
            expect(ddoc._body.views).to.have.keys("test1", "test2");
        });

        it("should return the design document object", function () {
            var ddoc = db.ddoc("test");
            expect(ddoc.view("test", noop)).to.equal(ddoc);
        });
    });
});
