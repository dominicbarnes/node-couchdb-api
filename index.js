var server = require("./lib/server");

exports.srv = function (host, port, ssl, cache) {
    return server.create(host, port, ssl, cache);
};

exports.db = function (name) {
    return this.srv().db(name);
};
