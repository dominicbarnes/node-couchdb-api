// dependencies
var Client = require("./client");
var Database = require("./database");
var utils = require("./utils");


// single export
module.exports = Server;


/**
 * Represents a CouchDB server
 *
 * @constructor
 * @param {String} href  Base URL for server
 */
function Server(href) {
    if (!(this instanceof Server)) {
        return new Server(href);
    }

    this.client = new Client(href);
}

/**
 * Returns the URL for this server, appending additional path info
 *
 * @param {String} [path]
 * @returns {String}
 */
Server.prototype.url = function (path) {
    return this.client.url(path);
};

/**
 * Retrieve info about this server
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.info = function (callback) {
    return this.client.request("get", "/")
        .end(utils.callback(callback.bind(this)));
};

/**
 * Retrieve the list of active tasks on this server
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.activeTasks = function (callback) {
    return this.client.request("get", "_active_tasks")
        .end(utils.callback(callback.bind(this)));
};

/**
 * Retrieve the list of databases on this server
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.allDbs = function (callback) {
    return this.client.request("get", "_all_dbs")
        .end(utils.callback(callback.bind(this)));
};

/**
 * Retrieve the server's log
 *
 * @param {Object} [query]
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.log = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    var req = this.client.request("get", "_log");
    if (query) req.query(query);
    return req.end(utils.callback(callback.bind(this)));
};

/**
 * Creates a new user document in the _users database
 *
 * The info object can include anything you want, but some notable fields are:
 *  - password {String}     This is actually **required**
 *  - roles {Array:String}  This is not required, but usually recommended
 *
 * @param {String} name
 * @param {Object} info
 * @param {Function} callback(err, userDoc, res)
 * @returns {superagent.Request}
 */
Server.prototype.register = function (name, info, callback) {
    callback = callback.bind(this);
    info.name = name;
    info.type = "user";
    var doc = this.db("_users").doc("org.couchdb.user:" + name);
    return doc.extend(info).save(function (err, results, response) {
        if (err) return callback(err);
        callback(null, doc, response);
    });
};

/**
 * Initiate a server restart
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.restart = function (callback) {
    return this.client.request("post", "_restart")
        .end(utils.callback(callback.bind(this)));
};

/**
 * Retrieve server statistics
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.stats = function (type, callback) {
    if (typeof type === "function") {
        callback = type;
        type = null;
    }

    var url = "/_stats";
    if (type) url += "/" + type;
    return this.client.request("get", url).end(utils.callback(callback.bind(this)));
};

/**
 * Retrieves one or more UUIDs from CouchDB
 *
 * @param {Number} [count]     Number to return (default: 1)
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.uuids = function (count, callback) {
    if (typeof count === "function") {
        callback = count;
        count = null;
    }

    var req = this.client.request("get", "_uuids");
    if (count && count > 0) req.query({ count: count });
    return req.end(utils.callback(callback.bind(this), "uuids"));
};

/**
 * Performs a cookie session login
 *
 * @param {String} name
 * @param {String} password
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.login = function (name, password, callback) {
    return this.client.request("post", "_session")
        .send({ name: name, password: password })
        .end(utils.callback(callback.bind(this)));
};

/**
 * Check on the current session information
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.session = function (callback) {
    return this.client.request("get", "_session")
        .end(utils.callback(callback.bind(this)));
};

/**
 * Check on the current session information
 *
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.logout = function (callback) {
    return this.client.request("del", "_session")
        .end(utils.callback(callback.bind(this)));
};

/**
 * Server configuration management
 *
 * If only a callback is passed, it will retrieve all server config
 *
 * If a section is included, it will retrieve the specified config section
 *
 * If a key is included, it will retrieve the specified config section/key
 *
 * If a value is also included, it will set that value to the specified section/key
 *
 * If the value is NULL, it will delete that specified config section/key
 *
 * @param {String} [section]
 * @param {String} [key]
 * @param {Mixed} [value]
 * @param {Function} callback
 * @returns {superagent.Request}
 */
Server.prototype.config = function (section, key, value, callback) {
    if (typeof section === "function") {
        callback = section;
        value = undefined;
        section = key = null;
    } else if (typeof key === "function") {
        callback = key;
        value = undefined;
        key = null;
    } else if (typeof value === "function") {
        callback = value;
        value = undefined;
    }

    var path = [ "_config" ];
    if (section) path.push(section);
    if (key)     path.push(key);

    var req;
    if (typeof value === "undefined") {
        req = this.client.request("get", path);
    } else if (value === null) {
        req = this.client.request("del", path);
    } else {
        req = this.client.request("put", path).type("json").send(JSON.stringify(value));
    }
    return req.end(utils.callback(callback));
};

/**
 * Creates a database object for this server
 */
Server.prototype.db = function (name) {
    return new Database(this, name);
};
