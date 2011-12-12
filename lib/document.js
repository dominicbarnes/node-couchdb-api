/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
    Attachment = require("./attachment");

/**
 * @class Document
 * Handles interaction at the document level
 */
function Document(db, body) {
    this.init(db, body);
}

/** @augments Document */
require("./request").call(Document.prototype);

/**
 * Handles initialization to allow for inheritance among Design and Local documents
 * Only intended for internal use... (TODO: find a way to make this private, while still allowing for inheritance)
 */
Document.prototype.init = function (db, body) {
    this.db = db;            // create a reference to the database object

    if (_.isString(body)) {
        this.id = body;
        this.body = { _id: body };
    } else if (body) {
        this.id = body._id || null;
        this.body = body;
    } else {
        this.id = null; // default: null (CouchDB can generate an `_id` for us)
        this.body = {};
    }

    if (this.db) {
        this.urlObj = _.clone(db.urlObj); // create a copy, so we can modify for this doc

        if (this.id) {
            this.urlObj.pathname += this.id; // if there is an id, initialize where needed
        }

        this.server = db.server; // create a reference to the server object
        this.client = this.server.client; // create a reference to HTTP client
    }
};

/**
 * Retrieve the document from the server
 *
 * `GET /db/doc`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Document.prototype.get = function (callback) {
    var self = this;
    return this.req("get", null, function (err, response) {
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
Document.prototype.save = function (callback) {
    var self = this;
    return this.req(this.id ? "put" : "post", null, this.body, function (err, response) {
        if (!err) {
            if (!self.id) {
                self.id = self.body._id = response.id;
                self.urlObj.pathname += response.id;
            }
            self.body._rev = response.rev;
        }

        callback.apply(self, arguments);
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
Document.prototype.del = function (callback) {
    var self = this,
        options = { headers: { "if-match": this.body._rev } }; // use "If-Match" instead of URL param

    return this.req("del", null, options, function (err, response) {
        if (!err) {
            self.body = false;
        }

        callback.apply(self, arguments);
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
Document.prototype.show = function (show, query, callback) {
    if (_.isFunction(query)) {
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

    return this.req("get", url, callback);
};

/**
 * Shorthand for getting/setting basic properties (only works 1 level deep)
 *
 * @param {string} field
 * @param {mixed} [value]
 *
 * @return {object|mixed} this|value  set is Chainable, get is not
 */
Document.prototype.prop = function (field, value) {
    if (_.isUndefined(value)) {
        return this.body[field];
    } else {
        this.body[field] = value;
        return this;
    }
};

Document.prototype.attachment = function (name) {
    return new Attachment(this, name);
};

/** Export to CommonJS */
module.exports = Document;
