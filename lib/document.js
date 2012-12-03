/**
 * ### Document API
 *
 * A `Document` object represents a single document.
 *
 *     var doc = db.doc("my-doc-id")
 */
var client     = require("./client"),
    attachment = require("./attachment"),
    prototype  = Object.create(client);

/**
 * This property helps maintain the internals of the object if it is set after
 * initialization. (keeps _id in sync with the rest of the body)
 *
 * @property body
 */
Object.defineProperty(prototype, "body", {
    get: function () {
        return this._body;
    },
    set: function (v) {
        this._body = v;
        if (v._id) {
            this.id = v._id;
        } else {
            delete this.id;
        }
    }
});

/**
 * Another property to help keep the internals in line. This will make sure the
 * internal URL is in sync with the _id property even after initialization.
 *
 * @property id
 */
Object.defineProperty(prototype, "id", {
    get: function () {
        return this._url.pathname.split("/").slice(2).join("/");
    },
    set: function (v) {
        var path = this._url.pathname.split("/");
        path.splice(2, v.split("/").length, encodeURIComponent(v));
        this.body._id = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/**
 * Retrieve the document from the server
 *
 * @http GET /db/doc
 *
 * @param {Function} callback
 *
 * @return {Document} chainable
 */
prototype.get = function (callback) {
    var doc = this;
    return this._get(null, function (err, body, res) {
        if (!err) {
            doc.body = body;
        }

        callback.apply(doc, arguments);
    });
};

/**
 * Save the document to the server
 *
 * @http PUT /db/doc
 * @http POST /db
 *
 * @param {Function} callback
 *
 * @return {Document} chainable
 */
prototype.save = function (callback) {
    var doc = this,
        method = this.id ? "_put" : "_post";

    return this[method](null, this.body, null, function (err, body, res) {
        if (!err) {
            if (!doc.id) {
                doc.id = body.id;
            }
            doc.body._rev = body.rev;
        }

        callback.apply(doc, arguments);
    });
};

/**
 * Delete the document from the server
 *
 * @http DELETE /db/doc
 *
 * @param {Function} callback
 *
 * @return {Document} chainable
 */
prototype.del = function (callback) {
    var doc = this,
        options = { headers: { "if-match": this.body._rev } }; // use "If-Match" instead of URL param

    return this._del(null, options, function (err, body, res) {
        if (!err) {
            doc.body = false;
        }

        callback.apply(doc, arguments);
    });
};

/**
 * Execute a show function for the current document
 *
 * @http GET /db/_design/design-doc/_show/show-name/doc
 *
 * @param {String}   show        The name of the show function (ddoc/show)
 * @param {Object}   [query]
 * @param {Object}   [options]
 * @param {Function} callback
 *
 * @return {Document} chainable
 */
prototype.show = function (show, query, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = null;
    }
    if (typeof query === "function") {
        callback = query;
        options = null;
        query = null;
    }

    show = show.split("/");
    var ddoc = show[0], url;
    show = show[1];

    url = {
        replace: true,
        pathname: "/" + this.db.name + "/_design/" + ddoc + "/_show/" + show + "/" + this.id
    };

    if (query) {
        url.query = query;
    }

    options = options || {};
    if (!("json" in options)) {
        options.json = false;
    }

    return this._get(url, options, callback);
};

/**
 * Shorthand for getting/setting basic properties (only works 1 level deep)
 *
 * @param {String}  field
 * @param {Various} [value]
 *
 * @return {Various}  Set = chainable, Get = returns current value
 */
prototype.prop = function (field, value) {
    if (value === undefined) {
        return this.body[field];
    } else {
        this.body[field] = value;
        return this;
    }
};

/**
 * Create a new Attachment object
 *
 * @param {String} name
 *
 * @return {Attachment}
 */
prototype.attachment = function (name) {
    return attachment.create(this, name);
};

/*!
 * Handles initialization to allow for inheritance among Design and Local documents
 * Only intended for internal use...
 *
 * TODO: find a way to make prototype._init private, while still allowing for inheritance
 *
 * @param {Database} db
 * @param {Various}  [body]
 */
prototype._init = function (db, body) {
    this.db = db;
    this.server = db.server;
    this.url = db.url;
    this.debug = db.debug;

    this._body = Object.create(null);

    if (typeof body === "string") {
        this.id = body;
    } else if (body) {
        this.body = body;
    }
};

/*!
 * allow for inheritance by exposing the prototype
 */
exports.prototype = prototype;

/*!
 * Creates a new Document object
 *
 * @param {Object} db
 * @param {mixed} [body]
 *
 * @return {Document}
 */
exports.create = function (db, body) {
    var doc = Object.create(prototype);
    doc._init(db, body);
    return doc;
};
