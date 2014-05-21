// dependencies
var url = require("url");
var superagent = require("superagent");


// single export
module.exports = Client;


function Client(base) {
    this._url = url.parse(base || "http://localhost:5984");
    this.agent = superagent.agent();
}

Client.prototype.basicAuth = function (user, pass) {
    if (!user) {
        delete this._url.auth;
    } else {
        this._url.auth = [ user, pass ].join(":");
    }

    return this;
};

Client.prototype.request = function (method, path) {
    return this.agent[method](this.url(path));
};

Client.prototype.url = function (path) {
    if (path) {
        if (Array.isArray(path)) path = path.join("/");
        return url.resolve(url.format(this._url), path);
    } else {
        return url.format(this._url);
    }
};
