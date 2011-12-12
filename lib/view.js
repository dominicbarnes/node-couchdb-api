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
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
View.prototype.query = function (query, postData, callback) {	
    if (typeof query === "function") {
        callback = query;
        query = {};
		postData = null;
    }
	
	if(typeof postData === "function") {
		callback = postData;
		postData = null;
	}
	
	if(!postData) {
		return this.req("get", { query: query }, callback);
	} else {
		return this.req("post", { query: query }, postData, callback);
	}
};

/**
 * Perform a map query against a stored view
 *
 * `GET /db/ddoc/_view/view`
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
View.prototype.map = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = {};
    }

    query.reduce = false;

    return this.query(query, callback);
};

/**
 * Perform a reduce query against a stored view
 *
 * `GET /db/ddoc/_view/view`
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
View.prototype.reduce = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = {};
    }

    query.reduce = true;

    return this.query(query, callback);
};

/**
 * Execute a list function for the current document
 *
 * `GET /db/_design/design-doc/_list/list-name/doc`
 *
 * @param {string} list        The name of the list function in the above design document
 *                                `ddoc/list` ...or... `list` if using same design document as this view
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this       Chainable
 */
View.prototype.list = function (list, query, callback) {
    if (_.isFunction(query)) {
        callback = query;
        query = null;
    }

    var list_ddoc, view;
    if (list.indexOf("/") > -1) {
        list = list.split("/");
        list_ddoc = list[0];
        list = list[1];
        view = this.ddoc.name + "/" + this.name;
    } else {
        list_ddoc = this.ddoc.name;
        view = this.name;
    }

    var path = ["", this.db.name, "_design", list_ddoc, "_list", list, view];

    var url = {
        replace: true,
        pathname: path.join("/")
    };
    if (query) {
        url.query = query;
    }

    return this.req("get", url, callback);
};

/** Export to CommonJS */
module.exports = View;
