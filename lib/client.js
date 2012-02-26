/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

var request = require("request").defaults({ encoding: "utf8" }),
    url = require("url"),
    _ = require("underscore");

/**
 * The Client deals with all the HTTP communication with CouchDB.
 * It will handle content-negotiation and response.
 */
var proto = {};

proto._set_url = function (input, options) {
    var uri = url.parse(this.url),
        tmp;

    if (input) {
        if (typeof input === "string") {
            if (uri.pathname) {
                tmp = uri.pathname.slice(1).split("/");
                tmp.push(input);
                uri.pathname = tmp.join("/");
            } else {
                uri.pathname = input;
            }
        } else {
            if ("pathname" in input) {
                if (input.replace) {
                    uri.pathname = input.pathname;
                } else {
                    tmp = uri.pathname.slice(1).split("/");
                    tmp.push(input.pathname);
                    uri.pathname = tmp.join("/");
                }
                delete input.pathname;
            }
            if ("query"  in input) {
                if (input.replace) {
                    uri.query = _.clone(input.query);
                } else {
                    uri.query = _.extend({}, uri.query, input.query);
                }
                delete input.query;
            }
        }
    }

    if (uri.query) {
        ["startkey", "endkey", "key"].forEach(function (key) {
            if (key in uri.query) {
                uri.query[key] = JSON.stringify(uri.query[key]);
            }
        });
    }

    options.url = url.format(uri);
};

proto._set_body = function (input, options) {
    if (!input) {
        return;
    }

    if (typeof input === "string" || Buffer.isBuffer(input)) {
        options.body = input;
        return;
    }

    if (!options.headers) {
        options.json = input;
        return;
    }

    switch (options.headers["content-type"]) {
    case "application/x-www-form-urlencoded":
        options.form = input;
        break;
    case "application/json":
        options.json = input;
        break;
    }
};

proto._callback = function (callback, options) {
    var self = this,
        json = true;

    if (options.json !== undefined) {
        json = options.json;
    }

    return function (err, res, body) {
        if (err) {
            callback.call(self, err, body, res);
        } else {
            if (typeof body === "string" && json) {
                try {
                    body = JSON.parse(body);
                } catch (e) {
                    console.error(e, body);
                }
            }

            if (res.statusCode >= 300) {
                err = body;
                body = null;
            }

            callback.call(self, err, body, res);
        }
    };
};

proto._stream = function (stream, callback, options) {
    if (options.changes) {
        stream.on("data", function (chunk) {
            if (typeof chunk === "string") {
                chunk = chunk.trim();
            }
            if (chunk) {
                chunk = JSON.parse(chunk);
                if (chunk.seq) {
                    stream.emit("change", chunk);
                }
                if (chunk.last_seq) {
                    stream.emit("last", chunk.last_seq);
                }
            }
        });
    }

    callback.call(this, null, stream);
};

/**
 * Performs an HTTP GET request
 *
 * @param {object} [options]
 * @param {function} callback
 */
proto._get = function (url, options, callback) {
    if (typeof url === "function") {
        callback = url;
        options = null;
        url = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    options = options || {};
    this._set_url(url, options);

    if (options.stream) {
        if (!options.changes) {
            options.encoding = null;
        }
        this._stream(request.get(options), callback, options);
    } else {
        request.get(options, this._callback(callback, options));
    }
    return this;
};

/**
 * Performs an HTTP PUT request
 *
 * @param {string|object} body
 * @param {object} [options]
 * @param {function} callback
 */
proto._put = function (url, body, options, callback) {
    if (typeof url === "function") {
        callback = url;
        options = null;
        body = null;
        url = null;
    }
    if (typeof body === "function") {
        callback = body;
        options = null;
        body = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    options = options || {};
    this._set_url(url, options);
    if (options.stream) {
        body.pipe(request.put(options, this._callback(callback, options)));
    } else {
        this._set_body(body, options);
        request.put(options, this._callback(callback, options));
    }

    return this;
};

/**
 * Performs an HTTP POST request
 *
 * @param {string|object} body
 * @param {object} [options]
 * @param {function} callback
 */
proto._post = function (url, body, options, callback) {
    if (typeof url === "function") {
        callback = url;
        options = null;
        body = null;
        url = null;
    }
    if (typeof body === "function") {
        callback = body;
        options = null;
        body = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    options = options || {};
    this._set_url(url, options);
    this._set_body(body, options);

    request.post(options, this._callback(callback, options));
    return this;
};

/**
 * Performs an HTTP DELETE request
 *
 * @param {object} options
 * @param {function} callback
 */
proto._del = function (url, options, callback) {
    if (typeof url === "function") {
        callback = url;
        options = null;
        url = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    options = options || {};
    this._set_url(url, options);

    request.del(options, this._callback(callback, options));
    return this;
};

/** Export to CommonJS */
module.exports = Object.create(proto, {
    url: {
        get: function () {
            return url.format(this._url);
        },
        set: function (v) {
            this._url = typeof v === "string" ? url.parse(v) : v;
        }
    }
});
