/**
 * ### Database API
 *
 * A `Database` object represents a single CouchDB database.
 *
 *     var couchdb = require("couchdb-api");
 *
 *     // defaults to "http://localhost:5984/db-name"
 *     couchdb.db("db-name");
 *
 *     // or use a Server object to initialize
 *     couchdb.srv().db("db-name");
 */
var _         = require("underscore"),
    util      = require("./util"),
    doc       = require("./document"),
    ddoc      = require("./designdoc"),
    ldoc      = require("./localdoc"),
    prototype = Object.create(require("./client"));

/**
 * Getter/setter property for database name
 *
 * **Note** It is entirely dependent on `_url.pathname[1]`
 *
 * @property name
 */
Object.defineProperty(prototype, "name", {
    get: function () {
        return this._url.pathname.split("/")[1];
    },
    set: function (v) {
        var path = this._url.pathname.split("/");
        path[1] = v;
        this._url.pathname = path.join("/");
    }
});

/**
 * Get basic information about the database
 *
 * @http GET /db
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.info = function (callback) {
    return this._get(callback);
};

/**
 * Query the `_all_docs` special view
 *
 *     // default behavior
 *     db.allDocs(callback)
 *
 *     // adding query params
 *     db.allDocs({ include_docs: true }, callback)
 *
 *     // querying for specific keys
 *     db.allDocs(null, ["doc-id-1", "doc-id-2"], callback)
 *
 * @http GET /db/_all_docs
 * @param {Object} [query]
 * @param {Array} [keys]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.allDocs = function (query, keys, callback) {
    if (typeof query === "function") {
        callback = query;
        keys = null;
        query = null;
    }
    if (typeof keys === "function") {
        callback = keys;
        keys = null;
        if (Array.isArray(query)) {
            keys = query;
            query = null;
        }
    }

    var url = query ? { pathname: "_all_docs", query: query } : "_all_docs";

    if (keys) {
        return this._post(url, { keys: keys }, callback);
    } else {
        return this._get(url, callback);
    }
};

/**
 * Create the database
 *
 * @http PUT /db
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.create = function (callback) {
    return this._put(callback);
};

/**
 * Drop the database
 *
 * @http DELETE /db
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.drop = function (callback) {
    return this._del(callback);
};

/**
 * Drop the database, then create it again
 *
 * @http DELETE /db
 * @http PUT /db
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.recreate = function (callback) {
    var self = this;
    return this.drop(function () {
        self.create(callback);
    });
};

/**
 * Query (or initiate a stream) the CouchDB _changes API
 *
 * @http GET /db/_changes
 * @param {Object}   query
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.changes = function (query, callback) {
    var url = {
        pathname: "_changes",
        query: query
    };

    return this._get(url, { changes: true, stream: query.feed === "continuous" }, callback);
};

/**
 * Perform a database (or design document view index) compation
 *
 * @http POST /db/_compact
 * @http POST /db/_compact/ddoc
 * @param {String} [ddoc] If passed, will compact the specified design document's view indexes
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.compact = function (ddoc, callback) {
    if (typeof ddoc === "function") {
        callback = ddoc;
        ddoc = null;
    }

    var path = "_compact";
    if (ddoc) {
        path += "/" + ddoc;
    }

    return this._post(path, { json: true }, callback);
};

/**
 * Clear the cached view output
 *
 * @http POST /db/_view_cleanup
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.viewCleanup = function (callback) {
    return this._post("_view_cleanup", { json: true }, callback);
};

/**
 * Commits recent db changes to disk
 *
 * @http POST /db/_ensure_full_commit
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.ensureFullCommit = function (callback) {
    return this._post("_ensure_full_commit", { json: true }, callback);
};

/**
 * Purges references to deleted documents from the database
 *
 * @http POST /db/_purge
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.purge = function (docs, callback) {
    return this._post("_purge", { body: docs }, callback);
};

/**
 * Replicates the current db to another db
 *
 * @http POST /_replicate
 * @alias push
 * @param {String|Object} target
 * @param {Object} [query]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.replicate = function (target, query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    this.server.replicate(this, target, query, callback);

    return this;
};

prototype.push = prototype.replicate;

/**
 * Similar to replicate, except it uses the current db as the target instead of the source
 *
 * @http POST /_replicate
 * @param {Object} source
 * @param {Object} [query]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.pull = function (source, query, callback) {
    if (query === "function") {
        callback = query;
        query = null;
    }

    source.replicate(this, query, callback);

    return this;
};

/**
 * Gets/sets the security object for this db
 *
 * @http POST /db/_security
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.security = function (obj, callback) {
    if (typeof obj === "function") {
        callback = obj;
        obj = null;
    }

    if (obj) {
        this._put("_security", obj, callback);
    } else {
        this._get("_security", callback);
    }

    return this;
};

/**
 * Execute a temporary view
 *
 * @http POST /db/_temp_view
 * @param {Function} map
 * @param {Function} [reduce]
 * @param {Object} [query]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.tempView = function (map, reduce, query, callback) {
    var body = { map: util.formatFunction(map) },
        url;

    if (typeof reduce === "function") {
        callback = reduce;
        query = null;
        reduce = null;
    }
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    if (reduce) {
        body.reduce = typeof reduce === "string" ? reduce : util.formatFunction(reduce);
    }

    url = !!query ? { pathname: "_temp_view", query: query } : "_temp_view";

    return this._post(url, body, callback);
};

/**
 * Performs a bulk operation
 *
 * @http POST /db/_bulk_docs
 * @param {Array} docs Array of document objects
 * @param {String} [mode] "all-or-nothing" or "non-atomic"
 * @return {Object} chainable
 */
prototype.bulkDocs = function (docs, mode, callback) {
    if (typeof mode === "function") {
        callback = mode;
        mode = null;
    }

    var query = mode ? { mode: mode } : null;

    return this._post("_bulk_docs", { docs: docs }, query, callback);
};

/**
 * Initializes a new `Document` object for this database
 *
 * @param {String} [id]
 * @return {Object} a new Document object
 */
prototype.doc = function (id) {
    return doc.create(this, id);
};

/**
 * Initializes a new `DesignDocument` object for this database
 *
 * @alias ddoc
 * @param {String} name
 * @return {Object} a new DesignDocument object
 */
prototype.designDoc = function (name) {
    return ddoc.create(this, name);
};
prototype.ddoc = prototype.designDoc;

/**
 * Initializes a new `LocalDocument` object for this database
 *
 * @alias ldoc
 * @param {String} name
 * @return {Object} a new LocalDocument object
 */
prototype.localDoc = function (name) {
    return ldoc.create(this, name);
};
prototype.ldoc = prototype.localDoc;

/*!
 * Create a new database object
 *
 * @param {Object} server
 * @param {String} name
 * @return {Object} database
 */
module.exports = function (server, name) {
    var database = Object.create(prototype);
    database.server = server;
    database.url    = server.url;
    database.name   = name;
    database.debug  = server.debug;
    return database;
};
