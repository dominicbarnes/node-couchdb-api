var _ = require("underscore"),
    doc = require("./document"),
    view = require("./view"),
    util = require("./util");

// inherit the document prototype
var proto = Object.create(doc.proto);

// name: dependent on id (which is dependent on the url)
Object.defineProperty(proto, "name", {
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
 * Get statistical information about the design document
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.info = function (callback) {
    return this._get("_info", callback);
};

/**
 * Get/set the views
 *
 * @param {object} [views]
 *
 * @return {object} this|views
 */
proto.views = function (views) {
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
 * Set a named view
 *
 * @param {function} map
 * @param {function|string} [reduce]
 *
 * @return {object} this|view
 */
proto.view = function (name, map, reduce) {
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
 * Get/set the show functions
 *
 * @param {object} [shows]
 *
 * @return {object} this|shows
 */
proto.shows = function (shows) {
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
 * Get/set a named show function
 *
 * @param {string} name
 * @param {function} fn
 *
 * @return {object|function} this|show
 */
proto.show = function (name, fn) {
    if (fn) {
        this.shows()[name] = util.formatFunction(fn);
        return this;
    } else {
        return this.shows()[name];
    }
};

/**
 * Get/set the list functions
 *
 * @param {object} [lists]
 *
 * @return {object} this|lists
 */
proto.lists = function (lists) {
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
 * Get/set a named list function
 *
 * @param {string} name
 * @param {function} fn
 *
 * @return {object|function} this|list
 */
proto.list = function (name, fn) {
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
 * @param {object} [updates]
 *
 * @return {object} updates
 */
proto.updates = function (updates) {
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
 * Get/set a named update handler
 *
 * @param {string} name
 * @param {function} fn
 *
 * @return {object} this|updates
 */
proto.update = function (name, fn) {
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
 * @param {function} fn
 *
 * @return {object} this|val
 */
Object.defineProperty(proto, "validate", {
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
 * @param {function} fn
 *
 * @return {object} this
 */
proto.val = function (fn) {
    if (fn) {
        this.validate = fn;
        return this;
    } else {
        return this.validate;
    }
};

/**
 * Create a new designdocument object
 *
 * @param {mixed} db
 * @param {string} name
 *
 * @return {object} ddoc
 */
exports.create = function (db, name) {
    var ddoc = Object.create(proto);
    ddoc._init(db, "_design/" + name);
    return ddoc;
};
