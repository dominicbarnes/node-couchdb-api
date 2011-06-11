/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var Document = require("./document"),
	DesignDocument = require("./designdoc"),
	LocalDocument = require("./localdoc"),
	_ = require("underscore");

/**
 * @class Database
 * Handles interaction at the CouchDB database level
 */
function Database(server, name) {
	this.server = server; // add a reference to the server
	this.name = name;

	this.urlObj = _.clone(server.urlObj); // use a copy so we can make changes
	this.urlObj.pathname += name + "/";   // add the db name and trailing slash to the pathname

	this.client = this.server.client; // add a reference to the client
}

/** @augments Database */
require("./request").call(Database.prototype);

/**
 * Get basic information about the database
 *
 * `GET /db`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.info = function (callback) {
	this.req("get", callback);
};

/**
 * Create the database
 *
 * `PUT /db`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.create = function (callback) {
	this.req("put", callback);
};

/**
 * Drop the database
 *
 * `DELETE /db`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.drop = function (callback) {
	this.req("del", callback);
};

/**
 * Query the CouchDB `_changes` API
 *
 * `GET /db/_changes`
 *
 * @param {object} query       Query arguments to be passed
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.changes = function (query, callback) {
	var url = {
		pathname: "_changes",
		query: query
	};
	this.req("get", url, callback);
};

/**
 * Perform a database (or design document view index) compation
 *
 * * `POST /db/_compact`
 * * `POST /db/_compact/ddoc`
 *
 * @param {string} [ddoc]      If passed, will compact the specified design document's view indexes
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.compact = function (ddoc, callback) {
	if (typeof ddoc === "function") {
		callback = ddoc;
		ddoc = null;
	}

	var path = "_compact";
	if (ddoc) {
		path += "/" + ddoc;
	}

	this.req("post", path, callback);
};

/**
 * Clear the cached view output
 *
 * `POST /db/_view_cleanup`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.viewCleanup = function (callback) {
	this.req("post", "_view_cleanup", callback);
};

/**
 * Commits recent db changes to disk
 *
 * `POST /db/_ensure_full_commit`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Database.prototype.ensureFullCommit = function (callback) {
	this.req("post", "_ensure_full_commit", callback);
};

/**
 * Purges references to deleted documents from the database
 *
 * `POST /db/_purge`
 *
 * @param {function} callback  The callback function
 */
Database.prototype.purge = function (callback) {
	this.req("post", "_purge", callback);
};

/**
 * Replicates the current db to another db
 *
 * `POST /_replicate`
 *
 * @param {string|Database} target  The target db
 * @param {object} [query]          The querystring options to use
 * @param {function} callback       The callback function
 */
Database.prototype.replicate = function (target, query, callback) {
	if (_.isFunction(query)) {
		callback = query;
		query = null;
	}

	this.server.replicate(this, target, query, callback);
};

/**
 * Alias for replicate (sends the current db to another db)
 * @see Database.prototype.replicate
 */
Database.prototype.push = Database.prototype.replicate;

/**
 * Similar to replicate, except it uses the current db as the target instead of the source
 * TODO: Allow for string `source` parameter
 *
 * `POST /_replicate`
 *
 * @param {Database} source    The source db
 * @param {object} [query]     The querystring options to use
 * @param {function} callback  The callback function
 */
Database.prototype.pull = function (source, query, callback) {
	if (_.isFunction(query)) {
		callback = query;
		query = null;
	}

	source.replicate(this, query, callback);
};

/**
 * Gets/sets the security object for this db
 *
 * `POST /db/_security`
 *
 * @param {function} callback  The callback function
 */
Database.prototype.security = function (obj, callback) {
	if (_.isFunction(obj)) {
		callback = obj;
		obj = null;
	}

	if (obj) {
		this.req("put", "_security", obj, callback);
	} else {
		this.req("get", "_security", callback);
	}
};

/**
 * Execute a temporary view
 *
 * `POST /db/_temp_view`
 *
 * @param {function} map       The map function
 * @param {function} [reduce]  The reduce function
 * @param {object} [query]     Querystring parameters
 * @param {function} callback  The callback function
 */
Database.prototype.tempView = function (map, reduce, query, callback) {
	var args = _.toArray(arguments),
		body = { map: args.shift().toString() };

	callback = args.pop();

	if (args[0]) {
		body.reduce = args[0].toString();
	}

	query = args[2] || null;

	this.req("post", "_temp_view", body, query, callback);
};

/**
 * Performs a bulk operation
 *
 * @param {array} docs   Array of document objects
 * @param {string} mode  "all-or-nothing" or "non-atomic"
 */
Database.prototype.bulkDocs = function (docs, mode, callback) {
	if (_.isFunction(mode)) {
		callback = mode;
		mode = null;
	}

	this.req("post", "_bulk_docs", { docs: docs }, { mode: mode || "non-atomic" }, callback);
};

/**
 * Returns a new Document object
 *
 * @param {string} [id]  The Document's `_id`
 *
 * @return {Document}
 */
Database.prototype.doc = function (id) {
	return new Document(this, id);
};

/**
 * Returns a new DesignDocument object
 *
 * @param {string} name  The DesignDocument's `name`
 *
 * @return {DesignDocument}
 */
Database.prototype.designDoc = function (name) {
	return new DesignDocument(this, name);
};
Database.prototype.ddoc = Database.prototype.designDoc;

/**
 * Returns a new LocalDocument object
 *
 * @param {string} name  The LocalDocument's `name`
 *
 * @return {LocalDocument}
 */
Database.prototype.localDoc = function (name) {
	return new LocalDocument(this, name);
};
Database.prototype.ldoc = Database.prototype.localDoc;

// TODO: /db/_missing_revs
// TODO: /db/_revs_diff
// TODO: /db/_revs_limit

/** Export to CommonJS */
module.exports = Database;
