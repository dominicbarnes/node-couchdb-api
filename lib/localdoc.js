/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
    util = require("util");

/**
 * @class LocalDocument
 * Handles interaction at the local document level
 */
function LocalDocument(db, name) {
    this.init(db, "_local/" + name);

    this.name = name;
    this.urlObj.pathname += "/";
}

/** @augments Document */
util.inherits(LocalDocument, require("./document"));

/** Export to CommonJS */
module.exports = LocalDocument;
