// dependencies
var path = require("path");
var nock = require("nock");
var mock = module.exports = nock("http://localhost:5984/");

nock.disableNetConnect();

mock.defaultReplyHeaders({
    "Content-Type": "application/json"
});

// helper for getting mock data file paths
mock.file = function (type) {
    return function (file) {
        return path.join(__dirname, "mocks", type, file);
    };
};
