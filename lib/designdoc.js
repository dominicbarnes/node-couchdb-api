/**
 * ### DesignDocument API
 *
 * A `DesignDocument` object represents a single design document.
 *
 *     var doc = db.ddoc("my-ddoc-name")
 */
var _         = require("underscore"),
    doc       = require("./document"),
    view      = require("./view"),
    util      = require("./util"),
    prototype = Object.create(doc.prototype);

/**
 * Behaves similarly to the Document property with the same now
 *
 * @property name
 */
Object.defineProperty(prototype, "name", {
    get: function () {
        return this.id.split("/")[1];
    },
    set: function (v) {
        var id = this.id.split("/");
        id[1] = v;
        this.id = id.join("/");
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
        path.splice(2, v.split("/").length, encodeURI(v));
        this.body._id = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/**
 * Get statistical information about the design document
 *
 * @http GET /db/_design/ddoc
 *
 * @param {Function} callback
 *
 * @return {DesignDocument} chainable
 */
prototype.info = function (callback) {
    return this._get("_info", callback);
};

/**
 * Get/set all the views
 *
 * @param {Object} [views]
 *
 * @return {DesignDocument|Object} Set = chainable, Get = view hash
 */
prototype.views = function (views) {
    if (views === null || views === false) {
        delete this._body.views;
        return this;
    } else if (views && typeof views === "object") {
        _.each(views, function (view, name, list) {
            if (view.map && typeof view.map === "function") {
                view.map = util.formatFunction(view.map);
            }
            if (view.reduce && typeof view.reduce === "function") {
                view.reduce = util.formatFunction(view.reduce);
            }
        });
        this._body.views = views;
        return this;
    } else if (!this._body.views) {
        this._body.views = Object.create(null);
    }
    return this.body.views;
};

/**
 * Set a single named view
 *
 * @param {Function}        map
 * @param {Function|String} [reduce]
 *
 * @return {DesignDocument|Object}  Set = chainable, Get = view object
 */
prototype.view = function (name, map, reduce) {
    if (map) {
        var body = {
            map: util.formatFunction(map)
        };

        if (reduce) {
            body.reduce = util.formatFunction(reduce);
        }

        this.views()[name] = body;

        return this;
    } else {
        return view.create(this, name);
    }
};

/**
 * Get/set all the show functions
 *
 * @param {Object} [shows]
 *
 * @return {DesignDocument|Object}  Set = chainable, Get = show hash
 */
prototype.shows = function (shows) {
    if (shows === null || shows === false) {
        delete this._body.shows;
        return this;
    } else if (shows && typeof shows === "object") {
        _.each(shows, function (fn, name, list) {
            if (typeof fn === "function") {
                list[name] = util.formatFunction(fn);
            }
        });
        this._body.shows = shows;
        return this;
    } else if (!this._body.shows) {
        this._body.shows = Object.create(null);
    }
    return this.body.shows;
};

/**
 * Get/set a single show function
 *
 * @param {String} name
 * @param {Function} fn
 *
 * @return {DesignDocument|Function}  Set = chainable, Get = show function
 */
prototype.show = function (name, fn) {
    if (fn) {
        this.shows()[name] = util.formatFunction(fn);
        return this;
    } else {
        return this.shows()[name];
    }
};

/**
 * Get/set all the list functions
 *
 * @param {Object} [lists]
 *
 * @return {DesignDocument|Object}  Set = chainable, Get = list hash
 */
prototype.lists = function (lists) {
    if (lists === null || lists === false) {
        delete this._body.lists;
        return this;
    } else if (lists && typeof lists === "object") {
        this._body.lists = lists;
        _.each(lists, function (fn, name, list) {
            if (typeof fn === "function") {
                list[name] = util.formatFunction(fn);
            }
        });
        return this;
    } else if (!this._body.lists) {
        this._body.lists = Object.create(null);
    }
    return this.body.lists;
};

/**
 * Get/set a single list function
 *
 * @param {String} name
 * @param {Function} fn
 *
 * @return {DesignDocument|Function}  Set = chainable, Get = list function
 */
prototype.list = function (name, fn) {
    if (fn) {
        this.lists()[name] = util.formatFunction(fn);
        return this;
    } else {
        return this.lists()[name];
    }
};

/**
 * Get/set the update handlers
 *
 * @param {Object} [updates]
 *
 * @return {DesignDocument|Object}  Set = chainable, Get = update hash
 */
prototype.updates = function (updates) {
    if (updates === null || updates === false) {
        delete this._body.updates;
        return this;
    } else if (updates && typeof updates === "object") {
        this._body.updates = updates;
        _.each(updates, function (fn, name, list) {
            if (typeof fn === "function") {
                list[name] = util.formatFunction(fn);
            }
        });
        return this;
    } else if (!this._body.updates) {
        this._body.updates = Object.create(null);
    }
    return this.body.updates;
};

/**
 * Get/set a single update handler
 *
 * @param {String} name
 * @param {Function} fn
 *
 * @return {DesignDocument|Function}  Set = chainable, Get = update function
 */
prototype.update = function (name, fn) {
    if (fn) {
        this.updates()[name] = util.formatFunction(fn);
        return this;
    } else {
        return this.updates()[name];
    }
};

/**
 * Get/set the validation function
 *
 * @property validate
 */
Object.defineProperty(prototype, "validate", {
    get: function () {
        return this.body.validate_doc_update;
    },
    set: function (v) {
        if (!v) {
            delete this.body.validate_doc_update;
        } else {
            this.body.validate_doc_update = util.formatFunction(v);
        }
    }
});

/**
 * Method wrapper for validate, to allow for chaining
 *
 * @param {Function} [fn]
 *
 * @return {DesignDocument|Function}  Set = chainable, Get = validation function
 */
prototype.val = function (fn) {
    if (fn) {
        this.validate = fn;
        return this;
    } else {
        return this.validate;
    }
};

/*!
 * Create a new DesignDocument object
 *
 * @param {Database} db
 * @param {String}   name
 *
 * @return {DesignDocument}
 */
exports.create = function (db, name) {
    var ddoc = Object.create(prototype);
    ddoc._init(db, "_design/" + name);
    return ddoc;
};
