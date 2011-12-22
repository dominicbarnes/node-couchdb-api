var doc = require("./document"),
    view = require("./view"),
    util = require("./util");

var proto = Object.create(doc.proto, {
    name: {
        get: function () {
            return this.id.split("/")[1];
        },
        set: function (v) {
            var id = this.id.split("/");
            id[1] = v;
            this.id = id.join("/");
        }
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
 * Get all the views (and initialize if not already present)
 *
 * @return {object} views
 */
proto.views = function () {
    this.body.views = this.body.views || {};
    return this.body.views;
};

/**
 * Add a new view to this design document
 *
 * @param {function} map
 * @param {function|string} [reduce]
 *
 * @return {object} this|views
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
 * Get all the show functions
 *
 * @return {object} shows
 */
proto.shows = function () {
    this.body.shows = this.body.shows || {};
    return this.body.shows;
};

/**
 * Get/set the specified show function
 *
 * @param {string} name
 * @param {function} fn
 *
 * @return {object} shows
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
 * Get all the list functions
 *
 * @return {object} lists
 */
proto.lists = function () {
    this.body.lists = this.body.lists || {};
    return this.body.lists;
};

/**
 * Get/set the specified list function
 *
 * @param {string} name
 * @param {function} fn
 *
 * @return {object} this|lists
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
 * Get all the update handler
 *
 * @return {object} updates
 */
proto.updates = function () {
    this.body.updates = this.body.updates || {};
    return this.body.updates;
};

/**
 * Get/set the specified update handler
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
        this.body.validate_doc_update = util.formatFunction(v);
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
