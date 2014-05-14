var expect = require("expect.js");
var CouchError = require("../lib/coucherror");

// sample error body
var err = new CouchError({
    error: "internal_error",
    reason: "Unknown error"
});

describe("CouchError(data)", function () {
    it("should set the message property from reason", function () {
        expect(err.message).to.equal("Unknown error");
    });

    it("should set the type property from error", function () {
        expect(err.type).to.equal("internal_error");
    });

    it("should have a name property", function () {
        expect(err.name).to.equal("CouchError");
    });
});

describe("CouchError#toString()", function () {
    it("should format with all the info", function () {
        expect(err.toString()).to.equal("CouchError: Unknown error (internal_error)");
    });
});
