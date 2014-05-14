// dependencies
var url = require("url");
var superagent = require("superagent");
var CouchError = require("./coucherror");


// single export
module.exports = Client;


/**
 * A helper for making requests against a CouchDB database. This handles generating proper URLs,
 * (given a base server URL) attaching authentication information as well as managing sessions.
 *
 * @constructor
 * @param {String} base  URL for the CouchDB Server
 */
function Client(base) {
    this.url = url.parse(base || "http://localhost:5984");
    this.agent = superagent.agent();
}


/**
 * Attaches HTTP Basic authentication information to be used in future requests
 *
 * @param {String} user
 * @param {String} pass
 * @returns {Client}
 */
Client.prototype.basicAuth = function (user, pass) {
    if (!user) {
        delete this.url.auth;
    } else {
        this.url.auth = [ user, pass ].join(":");
    }

    return this;
};


/**
 * Builds a URL for issuing a request (prefixing the proper base URL)
 *
 * @param {String|Object} path
 * @returns {String}
 */
Client.prototype.requestUrl = function (path) {
    if (path) {
        if (Array.isArray(path)) path = path.join("/");
        return url.resolve(url.format(this.url), path);
    } else {
        return url.format(this.url);
    }
};


/**
 * Issues an HTTP request against the CouchDB server. As an added bonus, it will monitor
 * the response for CouchDB-specific errors.
 *
 * In other words, if the response has an error status code and the response body formatted like:
 *
 * {
 *   "error": "conflict",
 *   "reason": "Document update conflict."
 * }
 *
 * @param {String} method
 * @param {String} path
 * @returns {superagent.Request}
 */
Client.prototype.request = function (method, path) {
    return this.agent[method](this.requestUrl(path));
};
