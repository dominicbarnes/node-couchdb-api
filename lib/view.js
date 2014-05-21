// dependencies
var utils = require("./utils");


// single export
module.exports = View;


function View(ddoc, name) {
    if (!(this instanceof View)) {
        return new View(ddoc, name);
    }

    this.name = name;
    this.ddoc = ddoc;
    this.database = ddoc.database;
    this.server = ddoc.server;
    this.client = ddoc.client;
}

View.prototype.url = function () {
    return this.client.url([ this.database.name, this.ddoc.id(), "_view", this.name ]);
};

View.prototype.query = function (params, callback) {
    if (typeof params === "function") {
        callback = params;
        params = null;
    }

    var url = this.url();
    var req;

    if (params) {
        if (params.keys) {
            req = this.client.request("post", url).send(params);
        } else {
            req = this.client.request("get", url).query(View.normalize(params));
        }
    } else {
        req = this.client.request("get", url);
    }

    return req.end(utils.callback(callback.bind(this)));
};


var jsonKeys = [
    "endkey",
    "end_key",
    "endkey_docid",
    "end_key_doc_id",
    "key",
    "startkey",
    "start_key",
    "startkey_docid",
    "start_key_doc_id",
];

View.normalize = function (query) {
    if (!query || typeof query !== "object") return {};

    Object.keys(query).forEach(function (key) {
        var val = query[key];
        if (jsonKeys.indexOf(key) > -1) {
            query[key] = JSON.stringify(val);
        }
        if (typeof val === "boolean") {
            query[key] = val ? "true" : "false";
        }
    });

    return query;
};
