/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

var _ = require("underscore"),
    formats = {
        text: "text/plain",
        json: "application/json",
        html: "text/html",
        xml:  "application/xml"
    };

/**
 * @class Attachment
 * Handles interaction at the CouchDB attachment level
 */
function Attachment(doc, name) {
    this.name = name;

    this.server = doc.server;
    this.db = doc.db;
    this.doc = doc;

    this.urlObj = _.clone(doc.urlObj);
    this.urlObj.pathname += "/" + name;

    this.client = doc.client;
}

/** @augments Attachment */
require("./request").call(Attachment.prototype);

function getFormat(key) {
    return formats[key] || key || null;
}

Attachment.prototype.setBody = function (format, body) {
    this.format = getFormat(format);
    this.body   = body;
    return this;
};

/**
 * Retrieve an attachment
 *
 * @param {boolean} stream
 * @param {function} callback
 *
 * @return {Attachment}
 */
Attachment.prototype.get = function (stream, callback) {
    if (!callback) {
        callback = stream;
        stream = false;
    }

    return this.req("get", null, { stream: stream }, callback);
};

/**
 * Saves an attachment to the server
 *
 * @param {function} callback
 *
 * @return {Attachment}
 */
Attachment.prototype.save = function (callback) {
    var self = this,
        urlMod = { query: { rev: this.doc.body._rev } },
        opts = { headers: { "content-type": this.format } };

    return this.req("put", urlMod, this.body, opts, function (err, result) {
        if (!err) {
            self.doc.body._rev = result.rev; // update the parent document's rev number
        }
        callback.apply(self, arguments);           // pipe to the callback
    });
};

/**
 * Removes an attachment from the server
 *
 * @param {function} callback
 *
 * @return {Attachment}
 */
Attachment.prototype.del = function (callback) {
    return this.req("delete", { query: { rev: this.doc.body._rev } }, callback);
};

/** Export to CommonJS */
module.exports = Attachment;
