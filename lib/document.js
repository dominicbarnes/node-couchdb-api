// dependencies
var extend = require("extend");
var CouchError = require("./coucherror");
var utils = require("./utils");


// single export
module.exports = Document;


function Document(db, id, rev) {
    if (!(this instanceof Document)) {
        return new Document(db, id, rev);
    }

    this.client = db.client;
    this.database = db;
    this.server = db.server;

    if (typeof id === "string") {
        this.body({}).id(id);
        if (rev) this.rev(rev);
    } else {
        this.body(id || {});
    }
}

Document.prototype.url = function (path) {
    var id = this.id();
    var base = [ this.database.name ];
    if (id) base.push(id);
    return this.client.url(base.concat(path || []));
};

Document.prototype.id = function (id) {
    if (id) {
        this._body._id = id;
        return this;
    } else {
        return this._body._id;
    }
};

Document.prototype.rev = function (rev) {
    if (rev) {
        this._body._rev = rev;
        return this;
    } else {
        return this._body._rev;
    }
};

Document.prototype.body = function (body) {
    if (typeof body === "undefined") return this._body;

    if (!body._id) delete body._id;
    if (!body._rev) delete body._rev;
    this._body = body;
    return this;
};

Document.prototype.empty = function () {
    return this.body({
        _id: this.id(),
        _rev: this.rev()
    });
};

Document.prototype.extend = function (body) {
    extend(true, this._body, body);
    return this;
};


Document.prototype.destroy = function (callback) {
    var self = this;
    callback = callback.bind(this);
    return this.client.request("del", this.url())
        .query({ rev: this.rev() })
        .end(utils.callback(function (err, body) {
            if (err) return callback(err);
            self.rev(body.rev);
            self._body._deleted = true;
            callback(null, body);
        }));
};

Document.prototype.exists = function (callback) {
    callback = callback.bind(this);

    return this.client.request("head", this.url()).end(function (err, res) {
        if (err) {
            callback(err);
        } else if (res.ok) {
            callback(null, true);
        } else if (res.notFound) {
            callback(null, false);
        } else if (utils.hasCouchError(res)) {
            callback(new CouchError(res.body));
        } else {
            callback(new Error("unknown error"));
        }
    });
};

Document.prototype.get = function (callback) {
    var self = this;
    callback = callback.bind(this);
    return this.client.request("get", this.url()).end(utils.callback(function (err, body) {
        if (err) return callback(err);
        self.body(body);
        callback(null, body);
    }));
};

Document.prototype.save = function (callback) {
    var self = this;
    callback = callback.bind(this);
    var req = this.client.request(this.id() ? "put" : "post", this.url());
    var rev = this.rev();
    if (rev) req.query({ rev: rev });
    req.send(this.serialize(this._body));
    return req.end(utils.callback(function (err, result) {
        if (err) return callback(err);
        self.id(result.id);
        self.rev(result.rev);
        callback(null, result);
    }));
};

Document.prototype.show = function (name, body, callback) {
    if (typeof body === "function") {
        callback = body;
        body = null;
    }

    var fn = name.split("/");
    var id = this.id();
    var path = [ this.database.name, "_design", fn[0], "_show", fn[1] ];
    if (id) path.push(id);
    var req = this.client.request(body ? "post" : "get", path);
    if (body) req.send(body);
    return req.end(utils.callback(callback.bind(this)));
};

Document.prototype.update = function (name, body, callback) {
    if (typeof body === "function") {
        callback = body;
        body = null;
    }

    var fn = name.split("/");
    var id = this.id();
    var path = [ this.database.name, "_design", fn[0], "_update", fn[1] ];
    if (id) path.push(id);
    var req = this.client.request(id ? "put" : "post", path);
    if (body) req.send(body);
    return req.end(utils.callback(callback.bind(this)));
};


Document.prototype.serialize = function (input) {
    return JSON.stringify(input, function (key, value) {
        return typeof value === "function" ? value.toString() : value;
    });
};
