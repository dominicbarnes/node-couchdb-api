// dependencies
var Document = require("./document");
var View = require("./view");


// single export
module.exports = DesignDocument;

// inheritance
require("util").inherits(DesignDocument, Document);


function DesignDocument(db, name, rev) {
    if (!(this instanceof DesignDocument)) {
        return new DesignDocument(db, name, rev);
    }

    Document.apply(this, arguments);
}

DesignDocument.prototype.id = function (id) {
    if (id) id = "_design/" + id;
    return Document.prototype.id.call(this, id);
};

DesignDocument.prototype.language = function (key) {
    this._body.language = key;
    return this;
};

DesignDocument.prototype.options = function (options) {
    this._body.options = options;
    return this;
};

DesignDocument.prototype.filter = function (name, fn) {
    if (!this._body.filters) this._body.filters = {};
    this._body.filters[name] = fn;
    return this;
};

DesignDocument.prototype.list = function (name, fn) {
    if (!this._body.lists) this._body.lists = {};
    this._body.lists[name] = fn;
    return this;
};

DesignDocument.prototype.rewrite = function (rule) {
    if (!this._body.rewrites) this._body.rewrites = [];
    this._body.rewrites.push(rule);
    return this;
};

DesignDocument.prototype.show = function (name, fn) {
    if (!this._body.shows) this._body.shows = {};
    this._body.shows[name] = fn;
    return this;
};

DesignDocument.prototype.update = function (name, fn) {
    if (!this._body.updates) this._body.updates = {};
    this._body.updates[name] = fn;
    return this;
};

DesignDocument.prototype.validate = function (fn) {
    this._body.validate_doc_update = fn;
    return this;
};

DesignDocument.prototype.view = function (name, map, reduce) {
    if (!map && !reduce) return new View(this, name);

    if (!this._body.views) this._body.views = {};
    var view = { map: map };
    if (reduce) view.reduce = reduce;
    this._body.views[name] = view;
    return this;
};
