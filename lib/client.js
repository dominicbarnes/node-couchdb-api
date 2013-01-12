/*!
 * The Client deals with all the HTTP communication with CouchDB.
 * It will handle content-negotiation and response.
 */
var request = require("request").defaults({ encoding: "utf8" }),
    url     = require("url"),
    _       = require("underscore"),
    proto   = {};

/**
 * Prepares the URL options before a request
 *
 * @param {String|Object} input
 * @param {Object} options
 * @api private
 */
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
            if ("query" in input) {
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

    options.uri = url.format(uri);
};

/**
 * Prepares the body before making a request
 *
 * @param {String|Object|Buffer} input
 * @param {Object} options
 * @api private
 */
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

/**
 * Prepares the callback that intercepts the CouchDB response before
 * executing the user-supplied callback
 *
 * @param {Function} callback
 * @param {Options} options
 * @api private
 */
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

/**
 * Prepares the callback for a streamed response before passing control
 * back to the user
 *
 * @param {ReadableStream} stream
 * @param {Function} callback
 * @param {Object} options
 * @api private
 */
proto._stream = function (stream, callback, options) {
    if (options.changes) {
        var buf   = "",
            timer = null;

        stream.on("data", function (chunk) {
            if (typeof chunk !== "string") return;

            buf += chunk.trim();

            if (chunk) {
                try {
                    chunk = JSON.parse(buf);

                    buf = "";
                    if (timer) {
                        clearTimeout(timer);
                        timer = null;
                    }

                    if (chunk.seq) {
                        stream.emit("change", chunk);
                    }
                    if (chunk.last_seq) {
                        stream.emit("last", chunk.last_seq);
                    }
                } catch (e) {
                    if (!timer) {
                        timer = setTimeout(function () {
                            stream.emit("error", e);
                        }, 500);
                    }
                }
            }
        });
    }

    callback.call(this, null, stream);
};

/**
 * Wrapper for an HTTP GET request
 *
 * @param {String|Object} url
 * @param {Object} [options]
 * @param {Function} callback
 *
 * @return {Object} chainable
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
 * Wrapper for an HTTP PUT request
 *
 * @param {String|Object} [url]
 * @param {String|Object|ReadableStream|Buffer} [body]
 * @param {Object} [options]
 * @param {Function} callback
 *
 * @return {Object} chainable
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
 * Wrapper for an HTTP POST request
 *
 * @param {String|Object} [url]
 * @param {String|Object|Buffer} [body]
 * @param {Object} [options]
 * @param {Function} callback
 *
 * @return {Object} chainable
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
 * Wrapper for an HTTP DELETE request
 *
 * @param {String|Object} [url]
 * @param {Object} [options]
 * @param {Function} callback
 *
 * @return {Object} chainable
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

module.exports = Object.create(proto, {
    /**
     * A getter/setter property wrapper for _url
     */
    url: {
        get: function () {
            return url.format(this._url);
        },
        set: function (v) {
            this._url = typeof v === "string" ? url.parse(v) : v;
        }
    }
});
