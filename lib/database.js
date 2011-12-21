/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var client = require("./client"),
    document = require("./document"),
    designdoc = require("./designdoc"),
    localdoc = require("./localdoc"),
    _ = require("underscore");

/**
 * Handles interaction at the CouchDB database level
 */
var proto = Object.create(client, {
    name: {
        get: function () {
            return this._url.pathname.split("/")[1];
        },
        set: function (v) {
            var path = this._url.pathname.split("/");
            path[1] = v;
            this._url.pathname = path.join("/");
        }
    }
});

/**
 * Get basic information about the database
 *
 * `GET /db`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.info = function (callback) {
    return this._get(callback);
};

/**
 * Query the _all_docs special view
 *
 * `GET /db/_all_docs`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.allDocs = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    if (Array.isArray(query)) {
        return this._post("_all_docs", { keys: query }, callback);
    } else if (query) {
        return this._get({ pathname: "_all_docs", query: query }, callback);
    } else {
        return this._get("_all_docs", callback);
    }
};

/**
 * Create the database
 *
 * `PUT /db`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.create = function (callback) {
    return this._put(callback);
};

/**
 * Drop the database
 *
 * `DELETE /db`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.drop = function (callback) {
    return this._del(callback);
};

/**
 * Drop the database, then create it again
 *
 * `DELETE /db`
 * `PUT /db`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.recreate = function (callback) {
    var self = this;
    return this.drop(function () {
        self.create(callback);
    });
};

/**
 * Query the CouchDB `_changes` API
 *
 * `GET /db/_changes`
 *
 * @param {object}   query
 * @param {function} callback
 *
 * @return {object} this
 */
proto.changes = function (query, callback) {
    var url = {
        pathname: "_changes",
        query: query
    };

    return this._get(url, { changes: true, stream: query.feed === "continuous" }, callback);
};

/**
 * Perform a database (or design document view index) compation
 *
 * * `POST /db/_compact`
 * * `POST /db/_compact/ddoc`
 *
 * @param {string} [ddoc]      If passed, will compact the specified design document's view indexes
 * @param {function} callback
 *
 * @return {object} this
 */
proto.compact = function (ddoc, callback) {
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
 * `POST /db/_view_cleanup`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.viewCleanup = function (callback) {
    return this._post("_view_cleanup", { json: true }, callback);
};

/**
 * Commits recent db changes to disk
 *
 * `POST /db/_ensure_full_commit`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.ensureFullCommit = function (callback) {
    return this._post("_ensure_full_commit", { json: true }, callback);
};

/**
 * Purges references to deleted documents from the database
 *
 * `POST /db/_purge`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.purge = function (docs, callback) {
    return this._post("_purge", { body: docs }, callback);
};

/**
 * Replicates the current db to another db
 *
 * `POST /_replicate`
 *
 * @param {string|Database} target  The target db object (or a string name)
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.replicate = function (target, query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    this.server.replicate(this, target, query, callback);

    return this;
};

/**
 * Alias for replicate (sends the current db to another db)
 * @see proto.replicate
 */
proto.push = proto.replicate;

/**
 * Similar to replicate, except it uses the current db as the target instead of the source
 * TODO: Allow for string `source` parameter
 *
 * `POST /_replicate`
 *
 * @param {Database} source    The source db object
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.pull = function (source, query, callback) {
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
 * `POST /db/_security`
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.security = function (obj, callback) {
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
 * `POST /db/_temp_view`
 *
 * @param {function} map
 * @param {function} [reduce]
 * @param {object}   [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.tempView = function (map, reduce, query, callback) {
    var args = _.toArray(arguments),
        body = { map: args.shift().toString() };

    callback = args.pop();

    if (args[0]) {
        body.reduce = args[0].toString();
    }

    query = args[2] || null;

    return this._post("_temp_view", body, query, callback);
};

/**
 * Performs a bulk operation
 *
 * @param {array} docs   Array of document objects
 * @param {string} mode  "all-or-nothing" or "non-atomic"
 *
 * @return {object} this
 */
proto.bulkDocs = function (docs, mode, callback) {
    if (typeof mode === "function") {
        callback = mode;
        mode = null;
    }

    var query = mode ? { mode: mode } : null;

    return this._post("_bulk_docs", { docs: docs }, query, callback);
};

/**
 * Returns a new Document object
 *
 * @param {string} [id]
 *
 * @return {Document}
 */
proto.doc = function (id) {
    return document.create(this, id);
};

/**
 * Returns a new DesignDocument object
 *
 * @param {string} name  The DesignDocument's `name`
 *
 * @return {DesignDocument}
 */
proto.designDoc = function (name) {
    return designdoc.create(this, name);
};
proto.ddoc = proto.designDoc;

/**
 * Returns a new LocalDocument object
 *
 * @param {string} name  The LocalDocument's `name`
 *
 * @return {LocalDocument}
 */
proto.localDoc = function (name) {
    return localdoc.create(this, name);
};
proto.ldoc = proto.localDoc;

// TODO: /db/_missing_revs
// TODO: /db/_revs_diff
// TODO: /db/_revs_limit

/** Export to CommonJS */
exports.create = function (server, name) {
    var database = Object.create(proto);

    database.server = server;
    database.url = server.url;
    database.name = name;
    database.debug = server.debug;

    return database;
};
