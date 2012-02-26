var client = require("./client");

// short-hand mime-types
var formats = exports.formats = {
    text: "text/plain",
    json: "application/json",
    html: "text/html",
    xml:  "application/xml"
};

// inherit directly from client
var proto = Object.create(client);

// dependent on url
Object.defineProperty(proto, "name", {
    get: function () {
        return this._url.path.split("/")[3];
    },
    set: function (v) {
        var path = this._url.path.split("/");
        path[3] = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/**
 * Wrapper for getting a content-type format
 *
 * @param {string} key
 *
 * @return {string} type
 */
function getFormat(key) {
    return formats[key] || key || null;
}

/**
 * Set up the body of this attachment
 * TODO: Object.defineProperty instead
 *
 * @param {string} format
 * @param {mixed} body
 *
 * @return {object} this
 */
proto.setBody = function (format, body) {
    this.format = getFormat(format);
    this.body   = body;
    return this;
};

/**
 * Retrieve an attachment
 *
 * @param {boolean}  stream
 * @param {object}   [options]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.get = function (stream, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = null
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
 * @param {function} callback
 *
 * @return {object} this
 */
proto.save = function (callback) {
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
 * Removes an attachment from the server
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.del = function (callback) {
    return this._del({
        query: {
            rev: this.doc.body._rev
        }
    }, callback);
};

/**
 * Create a new attachment object
 *
 * @param {object} doc
 * @param {string} name
 *
 * @return {object} attachment
 */
exports.create = function (doc, name) {
    var attachment = Object.create(proto);

    attachment.doc = doc;
    attachment.db = doc.db;
    attachment.url = doc.url + "/" + name;
    attachment.debug = doc.debug;

    return attachment;
};
