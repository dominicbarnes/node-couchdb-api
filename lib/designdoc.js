/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
    doc = require("./document"),
    view = require("./view");

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
 * @param {function} callback  Callback function to be executed
 */
proto.info = function (callback) {
    return this._get("_info", callback);
};

/**
 * Get all the show functions
 */
proto.views = function () {
    this.body.views = this.body.views || {};
    return this.body.views;
};

/**
 * Add a new view to this design document
 *
 * @param {function} map              Map function for this view
 * @param {function|string} [reduce]  Reduce function for this view
 */
proto.view = function (name, map, reduce) {
    if (map) {
        var body = { map: map.toString() };

        if (reduce) {
            body.reduce = reduce.toString();
        }

        this.views()[name] = body;

        return this;
    } else {
        return view.create(this, name);
    }
};

/**
 * Get all the show functions
 */
proto.shows = function () {
    this.body.shows = this.body.shows || {};
    return this.body.shows;
};

/**
 * Get/set the specified show function
 */
proto.show = function (name, func) {
    if (func) {
        this.shows()[name] = func.toString();
        return this;
    } else {
        return this.shows()[name];
    }
};

/**
 * Get all the list functions
 */
proto.lists = function () {
    this.body.lists = this.body.lists || {};
    return this.body.lists;
};

/**
 * Get/set the specified list function
 */
proto.list = function (name, func) {
    if (func) {
        this.lists()[name] = func.toString();
        return this;
    } else {
        return this.lists()[name];
    }
};

/**
 * Get all the update handler
 */
proto.updates = function () {
    this.body.updates = this.body.updates || {};
    return this.body.updates;
};

/**
 * Get/set the specified update handler
 */
proto.update = function (name, func) {
    if (func) {
        this.updates()[name] = func.toString();
        return this;
    } else {
        return this.updates()[name];
    }
};

/**
 * Get/set the validation function
 */
proto.val = function (func) {
    if (func) {
        this.body.validate_doc_update = func.toString();
        return this;
    } else {
        return this.body.validate_doc_update;
    }
};

exports.create = function (db, name) {
    var ddoc = Object.create(proto);
    ddoc._init(db, "_design/" + name);
    return ddoc;
};
