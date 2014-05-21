// dependencies
var Client = require("./client");
var Database = require("./database");
var utils = require("./utils");

// single export
module.exports = Server;

function Server(href) {
    if (!(this instanceof Server)) {
        return new Server(href);
    }

    this.client = new Client(href);
}

// helper methods

Server.prototype.url = function (path) {
    return this.client.url(path);
};

Server.prototype.db = function (name) {
    return new Database(this, name);
};


// api calls

Server.prototype.activeTasks = function (callback) {
    return this.client.request("get", "_active_tasks")
        .end(utils.callback(callback.bind(this)));
};

Server.prototype.allDbs = function (callback) {
    return this.client.request("get", "_all_dbs")
        .end(utils.callback(callback.bind(this)));
};

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

Server.prototype.info = function (callback) {
    return this.client.request("get", "/")
        .end(utils.callback(callback.bind(this)));
};

Server.prototype.log = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    var req = this.client.request("get", "_log");
    if (query) req.query(query);
    return req.end(utils.callback(callback.bind(this)));
};

Server.prototype.login = function (name, password, callback) {
    return this.client.request("post", "_session")
        .send({ name: name, password: password })
        .end(utils.callback(callback.bind(this)));
};

Server.prototype.logout = function (callback) {
    return this.client.request("del", "_session")
        .end(utils.callback(callback.bind(this)));
};

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

Server.prototype.restart = function (callback) {
    return this.client.request("post", "_restart")
        .end(utils.callback(callback.bind(this)));
};

Server.prototype.session = function (callback) {
    return this.client.request("get", "_session")
        .end(utils.callback(callback.bind(this)));
};

Server.prototype.stats = function (type, callback) {
    if (typeof type === "function") {
        callback = type;
        type = null;
    }

    var url = "/_stats";
    if (type) url += "/" + type;
    return this.client.request("get", url).end(utils.callback(callback.bind(this)));
};

Server.prototype.uuids = function (count, callback) {
    if (typeof count === "function") {
        callback = count;
        count = null;
    }

    var req = this.client.request("get", "_uuids");
    if (count && count > 0) req.query({ count: count });
    return req.end(utils.callback(callback.bind(this), "uuids"));
};
