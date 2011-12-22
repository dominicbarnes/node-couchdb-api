/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var client = require("./client"),
    database = require("./database"),
    crypto = require("crypto"),
    _ = require("underscore");

/**
 * Helper function for generating a SHA1 hash of an input string
 * @param {string} input
 */
function sha1(input) {
    var hash = crypto.createHash("sha1");
    hash.update(input.toString());
    return hash.digest("hex");
}

/**
 * @class Document
 * Handles interaction at the proto level
 */
var proto = Object.create(client);

/**
 * Get basic information about the proto
 *
 * `GET /`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.info = function (callback) {
    return this._get(callback);
};

/**
 * Get a list of all the databases on the proto
 *
 * `GET /_all_dbs`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.allDbs = function (callback) {
    return this._get("_all_dbs", callback);
};

/**
 * Get information about all the active tasks currently running on the proto
 *
 * `GET /_active_tasks`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.activeTasks = function (callback) {
    return this._get("_active_tasks", callback);
};

/**
 * Get the text of the proto's log file
 *
 * `GET /_log`
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.log = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    var options = {
        responseContentType: "text/plain"
    };

    if (!query) {
        return this._get("_log", options, callback);
    } else {
        return this._get({
            pathname: "_log",
            query: query
        }, options, callback);
    }
};

/**
 * Restarts the proto process
 *
 * `GET /_restart`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.restart = function (callback) {
    return this._post("_restart", callback);
};

/**
 * Restarts the proto process
 *
 * `GET /_restart`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.stats = function (callback) {
    return this._get("_stats", callback);
};

/**
 * Get a list of generated UUIDs from the proto
 *
 * `GET /_uuids`
 *
 * @param {number} [count]     Number of UUIDs to be returned (default: 1)
 * @param {function} callback
 *
 * @return {object} this       Chainable
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
 * Specify a username/password to send to the proto with each request (uses HTTP Basic auth)
 *
 * @param {string} user
 * @param {string} pass
 *
 * @return {object} this  Chainable
 */
proto.setUser = function (user, pass) {
    if (user === false) {
        delete this._url.auth;
    } else {
        this._url.auth = user + ":" + pass;
    }
    return this;
};

/**
 * Attempt a login against the proto itself
 *
 * `POST /_session`
 *
 * @param {string} user
 * @param {string} pass
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.login = function (user, pass, callback) {
    var self = this, body, options;

    body = {
        name: user,
        password: pass
    };

    options = {
        headers: {
            "content-type": "application/x-www-form-urlencoded"
        }
    };

    return this._post("_session", body, options, function (err, response) {
        if (!err) {
            self.setUser(user, pass);
        }

        callback.apply(self, arguments);
    });
};

/**
 * Logout (destroy the session)
 *
 * `DELETE /_session`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.logout = function (callback) {
    return this._del("_session", function (err, result) {
        if (!err) {
            this.setUser(false);
        }
        callback.apply(this, arguments);
    });
};

/**
 * Check the status of the current session
 *
 * `GET /_session`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
proto.session = function (callback) {
    return this._get("_session", callback);
};

/**
 * Create a new user in the "_users" database
 *
 * @param {string}   name
 * @param {string}   pass
 * @param {object}   [options]
 * @param {function} callback
 *
 * @return {object} this  Chainable
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
 */
proto.userDoc = function (name, pass, options) {
    var user = !!options ? _.clone(options) : {};

    user._id  = "org.couchdb.user:" + name;
    user.name = name;
    user.roles = user.roles || [];

    if (!user.salt) {
        user.salt = sha1(new Date().valueOf());
    }
    user.password_sha = sha1(pass + user.salt);

    user.type = "user";

    return user;
};

/**
 * Performs a replication from this database to the specified dest db
 *
 * `POST /_replicate`
 *
 * @param {string|Database} source
 * @param {string|Database} target
 * @param {object} opts
 *
 * @return {object} this  Chainable
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
 * Returns a new Database object
 *
 * @param {string} name
 *
 * @return {Database}
 */
proto.db = function (name) {
    return database.create(this, name);
};

/** Export to CommonJS */
exports.create = function (host, port, ssl, cache) {
    var server = Object.create(proto);
    server.url = {
        hostname: host || "localhost",
        port:     port || 5984,
        protocol: !!ssl ? "https:" : "http:"
    };
    server.cache = cache ? {} : false;
    return server;
};
