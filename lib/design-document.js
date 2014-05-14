// dependencies
var Document = require("./document");
var View = require("./view");


// single export
module.exports = DesignDocument;

// inheritance
require("util").inherits(DesignDocument, Document);


/**
 * Represents a CouchDB design document
 *
 * @constructor
 * @param {Server} server
 * @param {String} name
 */
function DesignDocument(db, name, rev) {
    if (!(this instanceof DesignDocument)) {
        return new DesignDocument(db, name, rev);
    }

    Document.apply(this, arguments);
}

/**
 * Prefixes "_design/" to id during set (get is unaffected)
 *
 * @param {String} [id]
 * @returns {String|DesignDocument}
 */
DesignDocument.prototype.id = function (id) {
    if (id) id = "_design/" + id;
    return Document.prototype.id.call(this, id);
};

/**
 * Set the design document's query server language
 *
 * @param {String} key
 * @returns {DesignDocument}
 */
DesignDocument.prototype.language = function (key) {
    this._body.language = key;
    return this;
};

/**
 * Set the design document's view options
 *
 * @param {Object} options
 * @returns {DesignDocument}
 */
DesignDocument.prototype.options = function (options) {
    this._body.options = options;
    return this;
};

/**
 * Adds a filter function to the design document
 *
 * @param {String} name
 * @param {Function} fn
 * @returns {DesignDocument}
 */
DesignDocument.prototype.filter = function (name, fn) {
    if (!this._body.filters) this._body.filters = {};
    this._body.filters[name] = fn;
    return this;
};

/**
 * Adds a list function to the design document
 *
 * @param {String} name
 * @param {Function} fn
 * @returns {DesignDocument}
 */
DesignDocument.prototype.list = function (name, fn) {
    if (!this._body.lists) this._body.lists = {};
    this._body.lists[name] = fn;
    return this;
};

/**
 * Adds a rewrite rule to the design document
 *
 * @param {Object} rule
 * @returns {DesignDocument}
 */
DesignDocument.prototype.rewrite = function (rule) {
    if (!this._body.rewrites) this._body.rewrites = [];
    this._body.rewrites.push(rule);
    return this;
};

/**
 * Adds a show function to the design document
 *
 * @param {String} name
 * @param {Function} fn
 * @returns {DesignDocument}
 */
DesignDocument.prototype.show = function (name, fn) {
    if (!this._body.shows) this._body.shows = {};
    this._body.shows[name] = fn;
    return this;
};

/**
 * Adds an update function to the design document
 *
 * @param {String} name
 * @param {Function} fn
 * @returns {DesignDocument}
 */
DesignDocument.prototype.update = function (name, fn) {
    if (!this._body.updates) this._body.updates = {};
    this._body.updates[name] = fn;
    return this;
};

/**
 * Sets the validate_doc_update function for the design document
 *
 * @param {Function} fn
 * @returns {DesignDocument}
 */
DesignDocument.prototype.validate = function (fn) {
    this._body.validate_doc_update = fn;
    return this;
};

/**
 * Adds a view to the design document
 *
 * @param {String} name
 * @param {Function} map
 * @param {Function|String} reduce
 * @returns {DesignDocument}
 */
DesignDocument.prototype.view = function (name, map, reduce) {
    if (!map && !reduce) return new View(this, name);

    if (!this._body.views) this._body.views = {};
    var view = { map: map };
    if (reduce) view.reduce = reduce;
    this._body.views[name] = view;
    return this;
};
