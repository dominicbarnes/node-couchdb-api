/*jshint noarg:false */

// dependencies
var util = require("util");

// single export
module.exports = CouchError;

/**
 * Subclass of Error for CouchDB-specific error messages
 *
 * The `data` param is expected to be a CouchDB error object:
 *
 * {
 *   "error": "internal_error",
 *   "reason": "Unknown error"
 * }
 *
 * @constructor
 * @param {Object} data
 */
function CouchError(data) {
    this.message = data.reason;
    this.type = data.error;
    this._raw = data;
    Error.captureStackTrace(this, arguments.callee);
}

// inherit from the global Error object
util.inherits(CouchError, Error);

// Useful prototype property for printing error information
CouchError.prototype.name = "CouchError";

/**
 * Override of Error#toString()
 *
 * @returns {String}
 */
CouchError.prototype.toString = function () {
    return util.format("%s: %s (%s)", this.name, this.message, this.type);
};
