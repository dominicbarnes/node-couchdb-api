/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
	Document = require("./document");

/**
 * @class LocalDocument
 * Handles interaction at the local document level
 */
function LocalDocument(db, name) {
	var id = "_local/" + name;

	this.db = db;
	this.server = db.server;
	this.id = id;
	this.name = name;

	this.urlObj = _.clone(db.urlObj);

	this.body = { _id: id };
	this.urlObj.pathname += id + "/";

	this.client = this.server.client;
}

/** @augments Document */
_.extend(LocalDocument.prototype, Document.prototype);


/**
 * Get statistical information about the design document
 *
 * @param {function} callback  Callback function to be executed
 */
LocalDocument.prototype.info = function (callback) {
	this.req("get", "_info", callback);
};

/** Export to CommonJS */
module.exports = LocalDocument;
