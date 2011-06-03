/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore");

/**
 * @class Document
 * Handles interaction at the document level
 */
function Document(db, id) {
	this.db = db;            // create a reference to the database object
	this.server = db.server; // create a reference to the server object
	this.id = id || null;    // default: null (CouchDB can generate an `_id` for us)

	this.urlObj = _.clone(db.urlObj); // create a copy, so we can modify for this doc

	this.body = {}; // initialize the document body
	if (id) {
		// if there is an id, initialize where needed
		this.body._id = id;
		this.urlObj.pathname += id;
	}

	this.client = this.server.client; // create a reference to HTTP client
}

/** @augments Document */
_.extend(Document.prototype, require("./request"));

/**
 * Retrieve the document from the server
 *
 * `GET /db/doc`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, doc`)
 */
Document.prototype.get = function (callback) {
	var self = this;
	this.req("get", null, function (err, response) {
		if (!err) {
			self.body = response;
		}

		callback.apply(self, arguments);
	});
};

/**
 * Save the document's current state to the server
 *
 * * `PUT /db/doc` **(w/ id)**
 * * `POST /db`    **(w/o id)**
 *
 * @param {function} callback  Callback to be performed (arguments: `err, doc`)
 */
Document.prototype.save = function (callback) {
	var self = this;

	this.req(this.id ? "put" : "post", null, this.body, function (err, response) {
		if (!err) {
			if (!self.id) {
				self.id = self.body._id = response.id;
				self.urlObj.pathname += response.id;
			}
			self.body._rev = response.rev;
		}

		callback.apply(self, arguments);
	});
};

/**
 * Delete the document from the server
 *
 * `DELETE /db/doc`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, doc`)
 */
Document.prototype.del = function (callback) {
	var self = this,
		options = { headers: { "if-match": this.body._rev } }; // use "If-Match" instead of URL param

	this.req("del", null, options, function (err, response) {
		if (!err) {
			self.body = false;
		}

		callback.apply(self, arguments);
	});
};

// TODO
/**
 * Copy this document to another location on the server
 *
 * `COPY /db/doc`
 *
 * @param {string|Document} target  The target document
 * @param {function} callback       The callback function
Document.prototype.copy = function (target, callback) {

};
 */

/** Export to CommonJS */
module.exports = Document;
