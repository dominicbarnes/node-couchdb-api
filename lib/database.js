// dependencies
var url = require("url");
var CouchError = require("./coucherror");
var Document = require("./document");
var DesignDocument = require("./design-document");
var LocalDocument = require("./local-document");
var utils = require("./utils");


// single export
module.exports = Database;

/**
 * Represents a CouchDB Database
 *
 * @constructor
 * @param {Server} server
 * @param {String} name
 */
function Database(server, name) {
    if (!(this instanceof Database)) {
        return new Database(server, name);
    }

    this.client = server.client;
    this.server = server;
    this.name = name;
}

/**
 * Generate a URL (including the database prefix)
 *
 * @param {String} path
 * @returns {String}
 */
Database.prototype.url = function (path) {
    return this.client.requestUrl([ this.name ].concat(path || []));
};

/**
 * Determine whether or not this database exists
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
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

/**
 * Retrieve info about this database
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Database.prototype.info = function (callback) {
    return this.client.request("get", this.url())
        .end(utils.callback(callback.bind(this)));
};

/**
 * Create this database
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Database.prototype.create = function (callback) {
    return this.client.request("put", this.url())
        .end(utils.callback(callback.bind(this)));
};

/**
 * Delete this database
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Database.prototype.destroy = function (callback) {
    return this.client.request("del", this.url())
        .end(utils.callback(callback.bind(this)));
};

/**
 * Returns a document object for this database
 *
 * @param {String} id
 * @param {String} rev
 * @returns {Document}
 */
Database.prototype.doc = function (id, rev) {
    return new Document(this, id, rev);
};

/**
 * Returns a design document object for this database
 *
 * @param {String} id
 * @param {String} rev
 * @returns {Document}
 */
Database.prototype.ddoc = function (id, rev) {
    return new DesignDocument(this, id, rev);
};

/**
 * Returns a local document object for this database
 *
 * @param {String} id
 * @param {String} rev
 * @returns {Document}
 */
Database.prototype.ldoc = function (id, rev) {
    return new LocalDocument(this, id, rev);
};
