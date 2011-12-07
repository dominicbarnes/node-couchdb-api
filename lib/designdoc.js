/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
    View = require("./view"),
    util = require("util");

/**
 * @class DesignDocument
 * Handles interaction at the design document level
 */
function DesignDocument(db, name) {
    this.init(db, "_design/" + name);

    this.name = name;
    this.urlObj.pathname += "/";
}

/** @augments Document */
util.inherits(DesignDocument, require("./document"));


/**
 * Get statistical information about the design document
 *
 * @param {function} callback  Callback function to be executed
 */
DesignDocument.prototype.info = function (callback) {
    return this.req("get", "_info", callback);
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

        return this;
    } else {
        return new View(this, name);
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
        return this;
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
        return this;
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
        return this;
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
        return this;
    } else {
        return this.body.validate_doc_update;
    }
};

/** Export to CommonJS */
module.exports = DesignDocument;
