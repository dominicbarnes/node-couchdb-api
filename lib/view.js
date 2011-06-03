/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var Client = require("./client"),
	Document = require("./document"),
	_ = require("underscore");

/**
 * @class View
 * Handles interaction at the document level
 */
function View(ddoc, name) {
	this.ddoc = ddoc;          // create a reference to the design document object
	this.db = ddoc.db;         // create a reference to the database object
	this.server = ddoc.server; // create a reference to the server object
	this.name = name;          // default: null (CouchDB can generate an `_id` for us)

	this.urlObj = _.clone(ddoc.urlObj); // create a copy, so we can modify for this doc
	this.urlObj.pathname += "_view/" + name;

	this.client = this.server.client; // create a reference to HTTP client
}

/** @augments View */
require("./request").call(View.prototype);

/**
 * Perform a generic query against a stored view
 *
 * `GET /db/ddoc/_view/view`
 *
 * @param {object} [query]     Querystring params to add to the view request url
 * @param {function} callback  Callback to be performed (arguments: `err, doc`)
 */
View.prototype.query = function (query, callback) {
	if (typeof query === "function") {
		callback = query;
		query = {};
	}

	this.req("get", { query: query }, callback);
};

/**
 * Perform a map query against a stored view
 *
 * `GET /db/ddoc/_view/view`
 *
 * @param {object} [query]     Querystring params to add to the view request url
 * @param {function} callback  Callback to be performed (arguments: `err, doc`)
 */
View.prototype.map = function (query, callback) {
	if (typeof query === "function") {
		callback = query;
		query = {};
	}

	query.reduce = false;

	this.query(query, callback);
};

/**
 * Perform a reduce query against a stored view
 *
 * `GET /db/ddoc/_view/view`
 *
 * @param {object} [query]     Querystring params to add to the view request url
 * @param {function} callback  Callback to be performed (arguments: `err, doc`)
 */
View.prototype.reduce = function (query, callback) {
	if (typeof query === "function") {
		callback = query;
		query = {};
	}

	query.reduce = true;

	this.query(query, callback);
};

/** Export to CommonJS */
module.exports = View;
