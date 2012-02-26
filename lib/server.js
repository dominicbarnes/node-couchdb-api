var _ = require("underscore"),
    sha1 = require("./util").sha1,
    client = require("./client"),
    database = require("./database");

// inherit directly from the client object
var proto = Object.create(client);

/**
 * Get basic information about the server
 *
 * GET /
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.info = function (callback) {
    return this._get(callback);
};

/**
 * Get a list of all the databases on the server
 *
 * GET /_all_dbs
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.allDbs = function (callback) {
    return this._get("_all_dbs", callback);
};

/**
 * Get information about all the active tasks currently running on the server
 *
 * GET /_active_tasks
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.activeTasks = function (callback) {
    return this._get("_active_tasks", callback);
};

/**
 * Get the text of the server's log file
 *
 * GET /_log
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.log = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    return this._get(!query ? "_log" : {
        pathname: "_log",
        query:    query
    }, { json: false }, callback);
};

/**
 * Restarts the server process
 *
 * GET /_restart
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.restart = function (callback) {
    return this._post("_restart", callback);
};

/**
 * Get the server running stats
 *
 * GET /_stats
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.stats = function (callback) {
    return this._get("_stats", callback);
};

/**
 * Get a list of generated UUIDs
 *
 * GET /_uuids
 *
 * @param {number} [count]     Number of UUIDs to be returned (default: 1)
 * @param {function} callback
 *
 * @return {object} this
 */
proto.uuids = function (count, callback) {
    var self = this,
        query;

    if (typeof count === "function") {
        callback = count;
        count = 1;
    }

    query = {
        pathname: "_uuids",
        query: { count: count || 5 }
    };

    return this._get(query, function (err, response) {
        callback.call(self, null, response.uuids);
    });
};

/**
 * HTTP Basic Auth Params
 * set expects "user:pass" or [user,pass] format
 */
Object.defineProperty(proto, "auth", {
    get: function () {
        return this._url.auth;
    },
    set: function (v) {
        if (Array.isArray(v)) {
            this._url.auth = v.join(":");
        } else if (v) {
            this._url.auth = v;
        } else {
            delete this._url.auth;
        }
    }
});

/**
 * Attempt a login against the server itself
 *
 * POST /_session
 *
 * @param {string} user
 * @param {string} pass
 * @param {function} callback
 *
 * @return {object} this
 */
proto.login = function (user, pass, callback) {
    var body = {
            name: user,
            password: pass
        },
        options = {
            headers: {
                "content-type": "application/x-www-form-urlencoded"
            }
        };

    return this._post("_session", body, options, function (err, response) {
        if (!err) {
            this.auth = user + ":" + pass;
        }

        callback.apply(this, arguments);
    });
};

/**
 * Logout (destroy the session)
 *
 * DELETE /_session
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.logout = function (callback) {
    return this._del("_session", function (err, result) {
        if (!err) {
            this.auth = false;
        }
        callback.apply(this, arguments);
    });
};

/**
 * Check the status of the current session
 *
 * GET /_session
 *
 * @param {function} callback
 *
 * @return {object} this
 */
proto.session = function (callback) {
    return this._get("_session", callback);
};

/**
 * Create a new user in the `_users` database
 *
 * @param {string}   name
 * @param {string}   pass
 * @param {object}   [options]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.register = function (name, pass, options, callback) {
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    this.db("_users").doc(this.userDoc(name, pass, options)).save(callback);

    return this;
};

/**
 * Creates a properly structured user document
 *
 * @param {string} name
 * @param {string} pass
 * @param {object} [options]
 *
 * @return {object}  New User Document
 */
proto.userDoc = function (name, pass, options) {
    var user = !!options ? _.clone(options) : {};

    user._id  = "org.couchdb.user:" + name;
    user.name = name;
    user.roles = user.roles || [];

    if (!user.salt) {
        user.salt = sha1(Date.now()).slice(0, 10);
    }
    user.password_sha = sha1(pass, user.salt);

    user.type = "user";

    return user;
};

/**
 * Performs a replication from this database to the specified dest db
 *
 * POST /_replicate
 *
 * @param {mixed} source
 * @param {mixed} target
 * @param {object} opts
 *
 * @return {object} this
 */
proto.replicate = function (source, target, options, callback) {
    options = options || {};

    if (typeof source === "string") {
        options.source = source;
    } else if (source) {
        options.source = source.server === this ? source.name : source.url;
    }
    if (typeof target === "string") {
        options.target = target;
    } else if (target) {
        options.target = target.server === this ? target.name : target.url;
    }

    this._post("_replicate", options, callback);
};

/**
 * Returns a database object
 *
 * @param {string} name
 *
 * @return {object}
 */
proto.db = function (name) {
    return database.create(this, name);
};

/**
 * Create a new database object
 *
 * @param {string} [host]    Default: "localhost"
 * @param {number} [port]    Default: 5984
 * @param {boolean} [ssl]    Default: false
 * @param {boolean} [cache]  Default: false
 *
 * @return {object} server
 */
exports.create = function (host, port, ssl, cache) {
    var server = Object.create(proto);
    server.url = {
        hostname: host || "localhost",
        port:     port || 5984,
        protocol: !!ssl ? "https:" : "http:"
    };
    return server;
};
