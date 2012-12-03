/**
 * ### Attachment API
 *
 * An `Attachment` object represents a single attachment on a document.
 *
 *     var attachment = doc.attachment("my-ddoc-name");
 */
var client = require("./client"),
    prototype = Object.create(client),
    formats = exports.formats = {
        text: "text/plain",
        json: "application/json",
        html: "text/html",
        xml:  "application/xml"
    };

/**
 * Maintains the name as part of the URL
 *
 * @property name
 */
Object.defineProperty(prototype, "name", {
    get: function () {
        return this._url.path.split("/")[3];
    },
    set: function (v) {
        var path = this._url.path.split("/");
        path[3] = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/*!
 * Wrapper for getting a content-type format
 *
 * @param {String} key
 *
 * @return {String} type
 */
function getFormat(key) {
    return formats[key] || key || null;
}

/**
 * Set up the body of this attachment
 *
 * @param {String}  format
 * @param {Various} body
 *
 * @return {Attachment} chainable
 */
prototype.setBody = function (format, body) {
    // TODO: Object.defineProperty instead
    this.format = getFormat(format);
    this.body   = body;
    return this;
};

/**
 * Retrieve an attachment from a document
 *
 * @http GET /db/doc/attachment
 *
 * @param {Boolean}  stream
 * @param {Object}   [options]
 * @param {Function} callback
 *
 * @return {Attachment} chainable
 */
prototype.get = function (stream, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = null;
    }
    if (typeof stream === "function") {
        callback = stream;
        options = null;
        stream = false;
    }

    options = options || {};
    options.stream = !!stream;
    if (!("json" in options)) {
        options.json = false;
    }

    return this._get(null, options, callback);
};

/**
 * Saves an attachment to the server
 *
 * @http PUT /db/doc/attachment
 *
 * @param {Function} callback
 *
 * @return {Attachment} chainable
 */
prototype.save = function (callback) {
    var url = { query: { rev: this.doc.body._rev } },
        opts = { headers: { "content-type": this.format } };

    if (this.body.pipe) {
        opts.stream = true;
    }

    return this._put(url, this.body, opts, function (err, result) {
        if (!err) {
            // update the parent document's rev number
            this.doc.body._rev = result.rev;
        }
        callback.apply(this, arguments);
    });
};

/**
 * Removes an attachment from a document on the server
 *
 * @http DELETE /db/doc/attachment
 *
 * @param {Function} callback
 *
 * @return {Attachment} this
 */
prototype.del = function (callback) {
    return this._del({
        query: {
            rev: this.doc.body._rev
        }
    }, callback);
};

/*!
 * Create a new attachment object
 *
 * @param {Document} doc
 * @param {String} name
 *
 * @return {Attachment}
 */
exports.create = function (doc, name) {
    var attachment = Object.create(prototype);

    attachment.doc = doc;
    attachment.db = doc.db;
    attachment.url = doc.url + "/" + encodeURIComponent(name);
    attachment.debug = doc.debug;

    return attachment;
};
