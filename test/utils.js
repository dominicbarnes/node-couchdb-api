var expect = require("expect.js");
var utils = require("../lib/utils");
var CouchError = require("../lib/coucherror");

describe("utils.callback(fn, prop)", function () {
    it("should return a function", function () {
        expect(utils.callback()).to.be.a("function");
    });

    it("should invoke done", function (done) {
        var fn = utils.callback(done);
        fn(null, {});
    });

    it("should proxy errors", function () {
        var error = new Error("testing");

        var fn = utils.callback(function (err, body, res) {
            expect(err).to.equal(error);
            expect(body).to.not.be.ok();
            expect(res).to.be.ok();
        });

        fn(error, {});
    });

    it("should return a CouchError", function () {
        var response = {
            error: true,
            body: {
                error: "error",
                reason: "reason"
            }
        };

        var fn = utils.callback(function (err, body, res) {
            expect(err).to.be.a(CouchError);
            expect(body).to.not.be.ok();
            expect(res).to.equal(response);
        });

        fn(null, response);
    });

    it("should extract a property from res.body", function () {
        var response = {
            body: {
                uuids: [ "75480ca477454894678e22eec6002413" ]
            }
        };

        var fn = utils.callback(function (err, body, res) {
            expect(err).to.not.be.ok();
            expect(body).to.eql(response.body.uuids);
            expect(res).to.equal(response);
        }, "uuids");

        fn(null, response);
    });

    it("should properly return a text/plain response", function () {
        var response = {
            type: "text/plain",
            text: "this is a test"
        };

        var fn = utils.callback(function (err, body, res) {
            expect(err).to.not.be.ok();
            expect(body).to.equal(response.text);
            expect(res).to.equal(response);
        });

        fn(null, response);
    });

    it("should properly return a response body", function () {
        var response = {
            body: {
                ok: true
            }
        };

        var fn = utils.callback(function (err, body, res) {
            expect(err).to.not.be.ok();
            expect(body).to.eql(response.body);
            expect(res).to.equal(response);
        });

        fn(null, response);
    });
});

describe("utils.hasCouchError(res)", function () {
    it("should only work in special conditions", function () {
        var res = {
            error: true,
            body: {
                error: "error",
                reason: "reason"
            }
        };

        expect(utils.hasCouchError(res)).to.equal(true);
    });
});
