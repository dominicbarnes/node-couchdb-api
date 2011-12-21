/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
    client = require("./client"),
    attachment = require("./attachment");

/**
 * @class Document
 * Handles interaction at the document level
 */
var proto = Object.create(client, {
    body: {
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
    },
    id: {
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
    }
});

/**
 * Retrieve the document from the server
 *
 * `GET /db/doc`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.get = function (callback) {
    var self = this;
    return this._get(null, function (err, response) {
        if (!err) {
            self.body = response;
        }

        callback.apply(self, arguments);
    });
};

/**
 * Save the document's current state to the server
 *
 * * `PUT /db/doc` **(w/ id)**
 * * `POST /db`    **(w/o id)**
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.save = function (callback) {
    var doc = this,
        method = this.id ? "_put" : "_post";

    return this[method](null, this.body, null, function (err, response) {
        if (!err) {
            if (!doc.id) {
                doc.id = response.id;
            }
            doc.body._rev = response.rev;
        }

        callback.apply(doc, arguments);
    });
};

/**
 * Delete the document from the server
 *
 * `DELETE /db/doc`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.del = function (callback) {
    var doc = this,
        options = { headers: { "if-match": this.body._rev } }; // use "If-Match" instead of URL param

    return this._del(options, function (err, response) {
        if (!err) {
            doc.body = false;
        }

        callback.apply(doc, arguments);
    });
};

/**
 * Execute a show function for the current document
 *
 * `GET /db/_design/design-doc/_show/show-name/doc`
 *
 * @param {string} show        The name of the show function `ddoc/show`
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this       Chainable
 */
proto.show = function (show, query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    show = show.split("/");
    var ddoc = show[0],
        url;
    show = show[1];

    url = {
        replace: true,
        pathname: "/" + this.db.name + "/_design/" + ddoc + "/_show/" + show + "/" + this.id
    };

    if (query) {
        url.query = query;
    }

    return this._get(url, callback);
};

/**
 * Shorthand for getting/setting basic properties (only works 1 level deep)
 *
 * @param {string} field
 * @param {mixed} [value]
 *
 * @return {object|mixed} this|value  set is Chainable, get is not
 */
proto.prop = function (field, value) {
    if (value === undefined) {
        return this.body[field];
    } else {
        this.body[field] = value;
        return this;
    }
};

proto.attachment = function (name) {
    return attachment.create(this, name);
};

/**
 * Handles initialization to allow for inheritance among Design and Local documents
 * Only intended for internal use... (TODO: find a way to make this private, while still allowing for inheritance)
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

exports.proto = proto;

exports.create = function (db, body) {
    var doc = Object.create(proto);
    doc._init(db, body);
    return doc;
};
