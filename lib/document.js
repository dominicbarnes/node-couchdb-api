var client = require("./client"),
    attachment = require("./attachment");

// inherit directly from client
var proto = Object.create(client);

// internal document structure (affects id as well)
Object.defineProperty(proto, "body", {
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

// dependent on url, but also affects the body
Object.defineProperty(proto, "id", {
    get: function () {
        var path = this._url.pathname.split("/");
        if (path.length > 2 && path[2][0] === "_") {
            return path.slice(2, 4).join("/");
        } else {
            return path[2];
        }
    },
    set: function (v) {
        var path = this._url.pathname.split("/");
        path[2] = v;
        this.body._id = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/**
 * Retrieve the document from the server
 *
 * GET /db/doc
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.get = function (callback) {
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
 * PUT /db/doc
 * POST /db
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.save = function (callback) {
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
 * DELETE /db/doc
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.del = function (callback) {
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
 * GET /db/_design/design-doc/_show/show-name/doc
 *
 * @param {string} show        The name of the show function (ddoc/show)
 * @param {object} [query]
 * @param {object} [options]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.show = function (show, query, options, callback) {
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
 * @param {string} field
 * @param {mixed} [value]
 *
 * @return {mixed}
 */
proto.prop = function (field, value) {
    if (value === undefined) {
        return this.body[field];
    } else {
        this.body[field] = value;
        return this;
    }
};

/**
 * Create a new attachment object
 *
 * @param {string} name
 *
 * @return {object}
 */
proto.attachment = function (name) {
    return attachment.create(this, name);
};

/**
 * Handles initialization to allow for inheritance among Design and Local documents
 * Only intended for internal use...
 * (TODO: find a way to make this private, while still allowing for inheritance)
 *
 * @param {object} db
 * @param {mixed} [body]
 */
proto._init = function (db, body) {
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

// allow for inheritance by exposing the prototype
exports.proto = proto;

/**
 * Create a new document object
 *
 * @param {object} db
 * @param {mixed} [body]
 *
 * @return {object}
 */
exports.create = function (db, body) {
    var doc = Object.create(proto);
    doc._init(db, body);
    return doc;
};
