// dependencies
var CouchError = require("./coucherror");
var Document = require("./document");
var DesignDocument = require("./design-document");
var LocalDocument = require("./local-document");
var utils = require("./utils");

// single export
module.exports = Database;

function Database(server, name) {
    if (!(this instanceof Database)) {
        return new Database(server, name);
    }

    this.client = server.client;
    this.server = server;
    this.name = name;
}

// helper methods

Database.prototype.url = function (path) {
    return this.client.url([ this.name ].concat(path || []));
};

Database.prototype.doc = function (id, rev) {
    return new Document(this, id, rev);
};

Database.prototype.ddoc = function (id, rev) {
    return new DesignDocument(this, id, rev);
};

Database.prototype.ldoc = function (id, rev) {
    return new LocalDocument(this, id, rev);
};

// api methods

Database.prototype.create = function (callback) {
    return this.client.request("put", this.url())
        .end(utils.callback(callback.bind(this)));
};

Database.prototype.destroy = function (callback) {
    return this.client.request("del", this.url())
        .end(utils.callback(callback.bind(this)));
};

Database.prototype.exists = function (callback) {
    callback = callback.bind(this);

    return this.client.request("head", this.url()).end(function (err, res) {
        if (err) {
            callback(err);
        } else if (res.ok) {
            callback(null, true);
        } else if (res.notFound) {
            callback(null, false);
        } else if (utils.hasCouchError(res)) {
            callback(new CouchError(res.body));
        } else {
            callback(new Error("unknown error"));
        }
    });
};

Database.prototype.info = function (callback) {
    return this.client.request("get", this.url())
        .end(utils.callback(callback.bind(this)));
};
