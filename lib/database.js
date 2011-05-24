/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var Document = require("./document"),
	DesignDocument = require("./designdocument"),
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
_.extend(Database.prototype, require("./request"));

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
 * Returns a new Document object
 *
 * @param {string} [id]  The Document's `_id`
 * @return {object}      A new Document object
 */
Database.prototype.doc = function (id) {
	return new Document(this, id);
};

/**
 * Returns a new DesignDocument object
 *
 * @param {string} name  The DesignDocument's `name`
 * @return {object}      A new DesignDocument object
 */
Database.prototype.ddoc = function (name) {
	return new DesignDocument(this, name);
};

/** Export to CommonJS */
module.exports = Database;
