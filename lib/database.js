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
 * @param {function} callback
 *
 * @return {object} this
 */
Database.prototype.info = function (callback) {
	return this.req("get", callback);
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
Database.prototype.allDocs = function (query, callback) {
	if (_.isFunction(query)) {
		callback = query;
		query = null;
	}

	if (_.isArray(query)) {
		return this.req("post", "_all_docs", { keys: query }, callback);
	} else if (query) {
		return this.req("get", { pathname: "_all_docs", query: query }, callback);
	} else {
		return this.req("get", "_all_docs", callback);
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
Database.prototype.create = function (callback) {
	return this.req("put", callback);
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
Database.prototype.drop = function (callback) {
	return this.req("del", callback);
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
Database.prototype.recreate = function (callback) {
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
Database.prototype.changes = function (query, callback) {
	var url = {
		pathname: "_changes",
		query: query
	};

	return this.req("get", url, { changes: true, stream: query.feed === "continuous" }, callback);
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
Database.prototype.compact = function (ddoc, callback) {
	if (typeof ddoc === "function") {
		callback = ddoc;
		ddoc = null;
	}

	var path = "_compact";
	if (ddoc) {
		path += "/" + ddoc;
	}

	return this.req("post", path, callback);
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
Database.prototype.viewCleanup = function (callback) {
	return this.req("post", "_view_cleanup", callback);
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
Database.prototype.ensureFullCommit = function (callback) {
	return this.req("post", "_ensure_full_commit", callback);
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
Database.prototype.purge = function (docs, callback) {
	return this.req("post", "_purge", { body: docs }, callback);
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
Database.prototype.replicate = function (target, query, callback) {
	if (_.isFunction(query)) {
		callback = query;
		query = null;
	}

	this.server.replicate(this, target, query, callback);

	return this;
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
 * @param {Database} source    The source db object
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
Database.prototype.pull = function (source, query, callback) {
	if (_.isFunction(query)) {
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
Database.prototype.tempView = function (map, reduce, query, callback) {
	var args = _.toArray(arguments),
		body = { map: args.shift().toString() };

	callback = args.pop();

	if (args[0]) {
		body.reduce = args[0].toString();
	}

	query = args[2] || null;

	return this.req("post", "_temp_view", body, query, callback);
};

/**
 * Performs a bulk operation
 *
 * @param {array} docs   Array of document objects
 * @param {string} mode  "all-or-nothing" or "non-atomic"
 *
 * @return {object} this
 */
Database.prototype.bulkDocs = function (docs, mode, callback) {
	if (_.isFunction(mode)) {
		callback = mode;
		mode = null;
	}

	var query = mode ? { mode: mode } : null;

	return this.req("post", "_bulk_docs", { docs: docs }, query, callback);
};

/**
 * Returns a new Document object
 *
 * @param {string} [id]  The Document's `_id`
 *
 * @return {Document}
 */
Database.prototype.doc = function (body) {
	return new Document(this, body);
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
