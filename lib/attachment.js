/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

var _ = require("underscore"),
    client = require("./client"),
    formats = {
        text: "text/plain",
        json: "application/json",
        html: "text/html",
        xml:  "application/xml"
    };

var proto = Object.create(client, {
    name: {
        get: function () {
            return this._url.path.split("/")[3];
        },
        set: function (v) {
            var path = this._url.path.split("/");
            path[3] = v;
            this._url.path = this._url.pathname = path.join("/");
        }
    }
});

function getFormat(key) {
    return formats[key] || key || null;
}

proto.setBody = function (format, body) {
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
proto.get = function (stream, callback) {
    if (!callback) {
        callback = stream;
        stream = false;
    }

    return this._get(null, { stream: !!stream }, callback);
};

/**
 * Saves an attachment to the server
 *
 * @param {function} callback
 *
 * @return {Attachment}
 */
proto.save = function (callback) {
    var self = this,
        url = { query: { rev: this.doc.body._rev } },
        opts = { headers: { "content-type": this.format } };

    return this._put(url, this.body, opts, function (err, result) {
        if (!err) {
            // update the parent document's rev number
            self.doc.body._rev = result.rev;
        }
        callback.apply(self, arguments);
    });
};

/**
 * Removes an attachment from the server
 *
 * @param {function} callback
 *
 * @return {Attachment}
 */
proto.del = function (callback) {
    return this._del({ query: { rev: this.doc.body._rev } }, callback);
};

exports.create = function (doc, name) {
    var attachment = Object.create(proto);

    attachment.doc = doc;
    attachment.db = doc.db;
    attachment.url = doc.url + "/" + name;

    return attachment;
};
