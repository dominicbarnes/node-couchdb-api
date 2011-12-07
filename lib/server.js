/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var Client = require("./client"),
    Database = require("./database"),
    qs = require("querystring"),
    url = require("url"),
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
 * Handles interaction at the server level
 */
function Server(host, port, ssl) {
    // use this as the basis for our urlObj
    var urlObj = url.parse("http://localhost:5984/");

    // if host provided, augment the urlObj
    if (host) {
        urlObj.hostname = host;
    }

    // if port provided, augment the urlObj
    if (port) {
        urlObj.port = port;
    }

    if (ssl) {
        urlObj.protocol = "https:";
    }

    // delete placeholders to help .url()
    delete urlObj.href;
    delete urlObj.host;

    this.urlObj = urlObj; // add a public reference

    this.client = new Client(); // create a client for each server
}

/** @augments Server */
require("./request").call(Server.prototype);

/**
 * Get basic information about the server
 *
 * `GET /`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.info = function (callback) {
    return this.req("get", callback);
};

/**
 * Get a list of all the databases on the server
 *
 * `GET /_all_dbs`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.allDbs = function (callback) {
    return this.req("get", "_all_dbs", callback);
};

/**
 * Get information about all the active tasks currently running on the server
 *
 * `GET /_active_tasks`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.activeTasks = function (callback) {
    return this.req("get", "_active_tasks", callback);
};

/**
 * Get the text of the server's log file
 *
 * `GET /_log`
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.log = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    if (!query) {
        this.req("get", "_log", callback);
    } else {
        this.req("get", {
            pathname: "_log",
            query: query
        }, callback);
    }

    return this;
};

/**
 * Restarts the server process
 *
 * `GET /_restart`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.restart = function (callback) {
    return this.req("post", "_restart", callback);
};

/**
 * Restarts the server process
 *
 * `GET /_restart`
 *
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.stats = function (callback) {
    return this.req("get", "_stats", callback);
};

/**
 * Get a list of generated UUIDs from the server
 *
 * `GET /_uuids`
 *
 * @param {number} [count]     Number of UUIDs to be returned (default: 1)
 * @param {function} callback
 *
 * @return {object} this       Chainable
 */
Server.prototype.uuids = function (count, callback) {
    var self = this;

    if (typeof count === "function") {
        callback = count;
        count = 1;
    }

    var query = {
        pathname: "_uuids",
        query: { count: count || 5 }
    };

    return this.req("get", query, function (err, response) {
        callback.call(self, null, response.uuids);
    });
};

/**
 * Specify a username/password to send to the server with each request (uses HTTP Basic auth)
 *
 * @param {string} user
 * @param {string} pass
 *
 * @return {object} this  Chainable
 */
Server.prototype.setUser = function (user, pass) {
    this.client.user = {
        name:     user,
        password: pass
    };
    return this;
};

/**
 * Attempt a login against the server itself
 *
 * `POST /_session`
 *
 * @param {string} user
 * @param {string} pass
 * @param {function} callback
 *
 * @return {object} this  Chainable
 */
Server.prototype.login = function (user, pass, callback) {
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

    return this.req("post", "_session", body, options, function (err, response) {
        if (!err) {
            self.client.user = {
                ctx:      _.clone(response),
                name:     user,
                password: pass
            };
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
Server.prototype.logout = function (callback) {
    return this.req("del", "_session", callback);
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
Server.prototype.session = function (callback) {
    return this.req("get", "_session", callback);
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
Server.prototype.register = function (name, pass, options, callback) {
    if (_.isFunction(options)) {
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
Server.prototype.userDoc = function (name, pass, options) {
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
Server.prototype.replicate = function (source, target, opts, callback) {
    opts = opts || {};

    try {
        if (!_.isString(source)) {
            if (source.constructor.name !== "Database") {
                throw "Source is not a Database object";
            }

            source = _.isEqual(source.server, this) ? source.name : source.url();
        }

        if (!_.isString(target)) {
            if (target.constructor.name !== "Database") {
                throw "Source is not a Database object";
            }

            target = _.isEqual(target.server, this) ? target.name : target.url();
        }

        opts.source = source;
        opts.target = target;

        this.req("post", "_replicate", opts, callback);
    } catch (e) {
        callback.call(this, e);
    } finally {
        return this;
    }
};

/**
 * Returns a new Database object
 *
 * @param {string} name
 *
 * @return {Database}
 */
Server.prototype.db = function (name) {
    return new Database(this, name);
};

/** Export to CommonJS */
module.exports = Server;
