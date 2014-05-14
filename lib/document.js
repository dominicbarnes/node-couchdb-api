// dependencies
var extend = require("extend");
var CouchError = require("./coucherror");
var utils = require("./utils");


// single export
module.exports = Document;


/**
 * Represents a CouchDB Document
 *
 * @constructor
 * @param {Database} db
 * @param {String} id
 * @param {String} rev
 */
function Document(db, id, rev) {
    if (!(this instanceof Document)) {
        return new Document(db, id, rev);
    }

    this.client = db.client;
    this.database = db;
    this.server = db.server;

    if (typeof id === "string") {
        this.body({}).id(id);
        if (rev) this.rev(rev);
    } else {
        this.body(id || {});
    }
}

/**
 * Get and set the id for this document
 *
 * @param {String} [id]
 * @returns {String|Document}
 */
Document.prototype.id = function (id) {
    if (id) {
        this._body._id = id;
        return this;
    } else {
        return this._body._id;
    }
};

/**
 * Get and set the revision number for this document
 *
 * @param {String} [rev]
 * @returns {String|Document}
 */
Document.prototype.rev = function (rev) {
    if (rev) {
        this._body._rev = rev;
        return this;
    } else {
        return this._body._rev;
    }
};

/**
 * Generate a URL for this document
 *
 * @param {String} path
 * @returns {String}
 */
Document.prototype.url = function (path) {
    var id = this.id();
    var base = [ this.database.name ];
    if (id) base.push(id);
    return this.client.url(base.concat(path || []));
};

/**
 * Gets or sets the body of this document
 *
 * @param {Object} [body]
 * @returns {Document}
 */
Document.prototype.body = function (body) {
    if (typeof body === "undefined") return this._body;

    if (!body._id) delete body._id;
    if (!body._rev) delete body._rev;
    this._body = body;
    return this;
};

/**
 * Empties the contents of this document (preserving only _id and _rev)
 *
 * @returns {Document}
 */
Document.prototype.empty = function () {
    return this.body({
        _id: this.id(),
        _rev: this.rev()
    });
};

/**
 * Extends the body of this document
 *
 * @param {Object} body
 * @returns {Document}
 */
Document.prototype.extend = function (body) {
    extend(true, this._body, body);
    return this;
};

/**
 * Determine whether or not this document exists
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Document.prototype.exists = function (callback) {
    callback = callback.bind(this);

    return this.client.request("head", this.url()).end(function (err, res) {
        if (err) {
            callback(err);
        } else if (res.ok) {
            callback(null, true);
        } else if (res.notFound) {
            callback(null, false);
        } else if (utils.hasCouchError(res)) {
            callback(new CouchError(res.body));
        } else {
            callback(new Error("unknown error"));
        }
    });
};

/**
 * Retrieve this document from the database
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Document.prototype.get = function (callback) {
    var self = this;
    callback = callback.bind(this);
    return this.client.request("get", this.url()).end(utils.callback(function (err, body) {
        if (err) return callback(err);
        self.body(body);
        callback(null, body);
    }));
};

/**
 * Save this document to the database
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Document.prototype.save = function (callback) {
    var self = this;
    callback = callback.bind(this);
    var req = this.client.request(this.id() ? "put" : "post", this.url());
    var rev = this.rev();
    if (rev) req.query({ rev: rev });
    req.send(this.serialize(this._body));
    return req.end(utils.callback(function (err, result) {
        if (err) return callback(err);
        self.id(result.id);
        self.rev(result.rev);
        callback(null, result);
    }));
};

/**
 * Delete this document from the database
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Document.prototype.destroy = function (callback) {
    var self = this;
    callback = callback.bind(this);
    return this.client.request("del", this.url())
        .query({ rev: this.rev() })
        .end(utils.callback(function (err, body) {
            if (err) return callback(err);
            self.rev(body.rev);
            self._body._deleted = true;
            callback(null, body);
        }));
};

/**
 * Renders the specified document via a show handler function
 *
 * @param {String} name  "{ddoc}/{showfn}"
 * @param {Mixed} [body]
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Document.prototype.show = function (name, body, callback) {
    if (typeof body === "function") {
        callback = body;
        body = null;
    }

    var fn = name.split("/");
    var id = this.id();
    var path = [ this.database.name, "_design", fn[0], "_show", fn[1] ];
    if (id) path.push(id);
    var req = this.client.request(id ? "put" : "post", path);
    if (body) req.send(body);
    return req.end(utils.callback(callback.bind(this)));
};

/**
 * Calls an update handler function for this document
 *
 * @param {String} name  "{ddoc}/{updatefn}"
 * @param {Mixed} [body]
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Document.prototype.update = function (name, body, callback) {
    if (typeof body === "function") {
        callback = body;
        body = null;
    }

    var fn = name.split("/");
    var id = this.id();
    var path = [ this.database.name, "_design", fn[0], "_update", fn[1] ];
    if (id) path.push(id);
    var req = this.client.request(id ? "put" : "post", path);
    if (body) req.send(body);
    return req.end(utils.callback(callback.bind(this)));
};

/**
 * Serializes an Object into a CouchDB-ready JSON string
 *
 * TODO: move this to Client?
 *
 * @param {Object} input
 * @returns {String}
 */
Document.prototype.serialize = function (input) {
    return JSON.stringify(input, function (key, value) {
        return typeof value === "function" ? value.toString() : value;
    });
};
