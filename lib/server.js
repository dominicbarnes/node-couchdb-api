/**
 * ### Server API
 *
 * A `Server` object represents a single CouchDB node/server instance.
 *
 *     var couchdb = require("couchdb-api");
 *
 *     // only 1 argument, a full URL string pointing to your Couch
 *     var server = couchdb.srv("http://localhost:5984");
 */
var _         = require("underscore"),
    sha1      = require("./util").sha1,
    database  = require("./database"),
    prototype = Object.create(require("./client"));

/*!
 * Creates a new Server object.
 *
 * @param {String|Object} [uri]
 * @return {Object} Server object
 */
module.exports = function (uri) {
    var server = Object.create(prototype);
    server.url = uri || "http://localhost:5984";
    return server;
};

/**
 * Get basic information about the server
 *
 * @http GET /
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.info = function (callback) {
    return this._get(callback);
};

/**
 * Get a list of all the databases on the server
 *
 * @http GET /_all_dbs
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.allDbs = function (callback) {
    return this._get("_all_dbs", callback);
};

/**
 * Get information about all the active tasks currently running on the server
 *
 * @http GET /_active_tasks
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.activeTasks = function (callback) {
    return this._get("_active_tasks", callback);
};

/**
 * Get the text of the server's log file
 *
 * @http GET /_log
 * @param {Object} [query]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.log = function (query, callback) {
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
 * Restarts the server
 *
 * @http GET /_restart
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.restart = function (callback) {
    return this._post("_restart", callback);
};

/**
 * Get the server running stats
 *
 * @http GET /_stats
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.stats = function (callback) {
    return this._get("_stats", callback);
};

/**
 * Get a list of generated UUIDs
 *
 * @http GET /_uuids
 * @param {Number} [count] default = 1
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.uuids = function (count, callback) {
    var self = this,
        query;

    if (typeof count === "function") {
        callback = count;
        count = 1;
    }

    query = {
        pathname: "_uuids",
        query: { count: count || 1 }
    };

    return this._get(query, function (err, response) {
        callback.call(self, null, response.uuids);
    });
};

/**
 * Getter/setter property for HTTP Basic Auth parameters
 *
 *     // get
 *     server.auth; // "user:pass"
 *
 *     // set
 *     server.auth = [ "user", "pass" ];
 *     server.auth = "user:pass";
 *
 * @property auth
 */
Object.defineProperty(prototype, "auth", {
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
 * @http POST /_session
 * @param {String} user
 * @param {String} pass
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.login = function (user, pass, callback) {
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
 * @http DELETE /_session
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.logout = function (callback) {
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
 * @http GET /_session
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.session = function (callback) {
    return this._get("_session", callback);
};

/**
 * Create a new user in the `_users` database
 *
 * @param {String}   name
 * @param {String}   pass
 * @param {Object}   [options]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.register = function (name, pass, options, callback) {
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
 * @param {String} name
 * @param {String} pass
 * @param {Object} [options]
 * @return {Object} New User Document
 */
prototype.userDoc = function (name, pass, options) {
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
 * Performs a replication from this database to the destination database
 *
 * @http POST /_replicate
 * @param {String|Object} source
 * @param {String|Object} target
 * @param {Object} [options]
 * @param {Function} callback
 * @return {Object} chainable
 */
prototype.replicate = function (source, target, options, callback) {
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

    return this._post("_replicate", options, callback);
};

/**
 * Returns an object representing a database on this server
 *
 * @param {String} name
 * @return {Object} Database object
 */
prototype.db = function (name) {
    return database(this, name);
};
