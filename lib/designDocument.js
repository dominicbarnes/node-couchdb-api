/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
	Document = require("./document");

/**
 * @class DesignDocument
 * Handles interaction at the design document level
 */
function DesignDocument(db, name) {
	this.db = db;
	this.server = db.server;
	this.id = "_design/" + name;

	this.urlObj = _.clone(db.urlObj);

	this.body = {
		_id: this.id
	};
	this.urlObj.pathname += this.id;

	this.client = this.server.client;
}

/** @augments Document */
_.extend(DesignDocument.prototype, Document.prototype);

/**
 * Gets the list of views
 */
DesignDocument.prototype.views = function () {
	this.body.views = this.body.views || {};
	return this.body.views;
};

/**
 * Add a new view to this design document
 *
 * @param {function} map              Map function for this view
 * @param {function|string} [reduce]  Reduce function for this view
 */
DesignDocument.prototype.view = function (name, map, reduce) {
	if (map) {
		var view = { map: map.toString() };
		if (reduce) {
			view.reduce = reduce.toString();
		}
		this.views()[name] = view;
	} else {
		return this.views()[name];
	}
};

/**
 * Get all the show functions
 */
DesignDocument.prototype.shows = function () {
	this.body.shows = this.body.shows || {};
	return this.body.shows;
};

/**
 * Get/set the specified show function
 */
DesignDocument.prototype.show = function (name, func) {
	if (func) {
		this.shows()[name] = func.toString();
	} else {
		return this.shows()[name];
	}
};

/**
 * Get all the list functions
 */
DesignDocument.prototype.lists = function () {
	this.body.lists = this.body.lists || {};
	return this.body.lists;
};

/**
 * Get/set the specified list function
 */
DesignDocument.prototype.list = function (name, func) {
	if (func) {
		this.lists()[name] = func.toString();
	} else {
		return this.lists()[name];
	}
};

/**
 * Get all the update handler
 */
DesignDocument.prototype.updates = function () {
	this.body.updates = this.body.updates || {};
	return this.body.updates;
};

/**
 * Get/set the specified update handler
 */
DesignDocument.prototype.update = function (name, func) {
	if (func) {
		this.updates()[name] = func.toString();
	} else {
		return this.updates()[name];
	}
};

/**
 * Get/set the validation function
 */
DesignDocument.prototype.val = function (func) {
	if (func) {
		this.body.validate_doc_update = func.toString();
	} else {
		return this.body.validate_doc_update;
	}
};

/** Export to CommonJS */
module.exports = DesignDocument;
