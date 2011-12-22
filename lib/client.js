/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
    http = require("http"),
    url = require("url"),
    content = require("./content"),
    color = require("cli-color"),
    util = require("util");

/**
 * The Client deals with all the HTTP communication with CouchDB.
 * It will handle content-negotiation and response.
 */
var proto = {};

/**
 * Performs an HTTP request
 *
 * @param {object} [options]
 * @param {function} callback
 */
proto._request = function (options, callback) {
	var client = this,
		uri,
        req,
        cacheEntry,
        path,
        body,
        handler,
        logger;

    options.method  = options.method  || "GET";
    options.headers = options.headers || {};

    if (!options.replace) {
        if (options.pathname && this._url.pathname) {
            path = this._url.pathname.split("/");
            path.push(options.pathname);
            options.pathname = path.join("/");
        }
        if (options.query && this._url.query) {
            options.query = _.extend({}, this._url.query, options.query);
        }
    }
    _.defaults(options, this._url);

    options.headers.accepts = options.headers.accepts || content.accepts;
    if ((options.body && !options.headers["content-type"]) || options.json) {
        options.headers["content-type"] = "application/json";
    }

    if (options.query) {
        _.each(options.query, function (value, key, list) {
            switch (key) {
            // these keys must be propertly JSON-encoded before issuing the request
            case "key":
            case "startkey":
            case "endkey":
                list[key] = JSON.stringify(value);
                break;
            }
        });
    }

    options.path = ("/" + url.format({
        pathname: options.pathname,
        query:    options.query
    })).replace("//", "/");

	uri = url.format(options);
    logger = this._createLogger(options);
    logger.info("Starting Request Process");

	cacheEntry = this.cache && this.cache[uri];

	if (!options.stream && cacheEntry) {
		logger.info("Sending Etag with Request", cacheEntry.etag);
		options.headers["if-none-match"] = cacheEntry.etag;
	}

	logger.info("Options for Request", options);

	req = http.request(options, (function () {
		if (options.stream) {
			logger.debug("Streamed Response");

			return function (res) {
				if (options.changes) {
					res.setEncoding("utf8");
				}

				callback.call(client, null, res);

				res.on("data", function (chunk) {
					logger.debug("Chunk Received", chunk.length, chunk);

					if (options.changes) {
						chunk = chunk.trim();

						if (chunk) {
							chunk = JSON.parse(chunk);

							if (chunk.seq) {
								logger.info("Change Emitted", chunk);
								res.emit("change", chunk);
							}
						}
					}
				});

				res.on("end", function () {
					logger.info("Response Stream End");
				});

				res.on("error", function (e) {
					logger.error("HTTP Error", e);
				});
			};
		} else {
			return function (res) {
				var response = "";

				res.setEncoding("utf8");
                logger.info("Response Headers", res.headers);

				res.on("data", function (chunk) {
					logger.debug("Chunk received", chunk);
					response += chunk;
				});

				res.on("end", function () {
                    var contentType = res.headers["content-type"],
                        handler = content.handler(contentType || options.responseContentType || "application/json", "parse"),
                        result;

					logger.debug("Done collecting response", response);

                    if (handler) {
                        result = handler(response);
                        logger.info("Response Parsed", result);
                    } else {
                        try {
                            result = content.handler("application/json", "parse")(response);
                            logger.info("Result assumed to be JSON");
                        } catch (e) {
                            logger.warn("Could not parse as JSON");
                        }
                    }

					if (res.statusCode >= 200 && res.statusCode < 300) {
						logger.info("Successful CouchDB Request");

						if (client.cache && options.method === "GET" && res.headers.etag) {
                            logger.info("Adding Response to Etag Cache", res.headers.etag);
                            client.cache[uri] = {
                                etag:        res.headers.etag,
                                body:        response,
                                result:      result,
                                contentType: res.headers["content-type"]
                            };
						}

						callback.call(client, null, result, res);
					} else if (res.statusCode === 304) {
						result = cacheEntry.result || cacheEntry.body;
						logger.info("Etag matched, using cached version");
						callback.call(client, null, result, res);
					} else {
						logger.error("CouchDB returned an error", result);
						callback.call(client, result, null, res);
					}
				});

				res.on("error", function (e) {
					logger.critical("HTTP Response Error", e);
                    callback.call(client, e, null, res);
				});
			};
		}
	}()));

	if (options.body) {
		logger.info("Sending a Body with Request");

		body = options.body;

		if (Buffer.isBuffer(body)) {
			logger.info("Converting from Buffer to String");
			body = body.toString();
		}

        if ("content-type" in req._headers) {
            handler = content.handler(req._headers["content-type"], "format");
            if (handler) {
                logger.info("Body Formatted", body);
                body = handler(body);
            }
        }

		logger.debug("Request Body", body);

		if (body.readable) {
			body.on("data", function (chunk) {
				logger.debug("Request Body Chunk", chunk.length, chunk);
				req.write(chunk);
			});
			body.on("end", function () {
				logger.debug("Request Body Stream End");
				req.end();
			});
			return;
		}

		req.write(body);
	}

    req.on("error", function (err) {
        logger.critical("HTTP Request Error", err);
        callback.call(client, err, null);
    });

	req.end();

    return this;
};

/**
 * Performs an HTTP GET request
 *
 * @param {object} [options]
 * @param {function} callback
 */
proto._get = function (uri, options, callback) {
    if (typeof uri === "function") {
        callback = uri;
        options = null;
        uri = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    options = options || {};

    if (uri) {
        if (typeof uri === "string") {
            options.pathname = uri;
        } else {
            _.extend(options, uri);
        }
    }

    return this._request(options, callback);
};

/**
 * Performs an HTTP PUT request
 *
 * @param {string|object} body
 * @param {object} [options]
 * @param {function} callback
 */
proto._put = function (uri, body, options, callback) {
    if (typeof uri === "function") {
        callback = uri;
        options = null;
        body = null;
        uri = null;
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
    options.method = "PUT";

    if (uri) {
        if (typeof uri === "string") {
            options.pathname = uri;
        } else {
            _.extend(options, uri);
        }
    }

    if (body) {
        options.body = body;
    }

    return this._request(options, callback);
};

/**
 * Performs an HTTP POST request
 *
 * @param {string|object} body
 * @param {object} [options]
 * @param {function} callback
 */
proto._post = function (uri, body, options, callback) {
    if (typeof uri === "function") {
        callback = uri;
        options = null;
        body = null;
        uri = null;
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
    options.method = "POST";

    if (uri) {
        if (typeof uri === "string") {
            options.pathname = uri;
        } else {
            _.extend(options, uri);
        }
    }

    if (body) {
        options.body = body;
    }

    return this._request(options, callback);
};

/**
 * Performs an HTTP DELETE request
 *
 * @param {object} options
 * @param {function} callback
 */
proto._del = function (uri, options, callback) {
    if (typeof uri === "function") {
        callback = uri;
        options = null;
        uri = null;
    }
    if (typeof options === "function") {
        callback = options;
        options = null;
    }

    options = options || {};
    options.method = "DELETE";

    if (uri) {
        if (typeof uri === "string") {
            options.pathname = uri;
        } else {
            _.extend(options, uri);
        }
    }

    return this._request(options, callback);
};

var consoleMap = {
    // leave trailing spaces in method for them to line up vertically upon output
    debug: {
        method: "log",
        color:  "gray",
        spaces: "    ",
        level:  5
    },
    info: {
        method: "log",
        color:  "cyan",
        spaces: "     ",
        level:  4
    },
    warn: {
        method: "warn",
        color:  "yellow",
        spaces: "     ",
        level:  3
    },
    error: {
        method: "error",
        color:  "red",
        spaces: "    ",
        level:  2
    },
    critical: {
        method: "error",
        color:  "magenta",
        spaces: " ",
        level:  1
    }
};

proto._createLogger = function (req) {
    var client = this,
        logger = {},
        uri = color.bold(url.format(req)),
        method = color.blue.bold(req.method);

    _.each(consoleMap, function (map, level) {
        logger[level] = function () {
            if (client.debug && client._debug.level >= map.level) {
                var args = _.toArray(arguments);
                console[map.method].apply(null, [color[map.color](level) + map.spaces, method, uri].concat(args));
            }
        };
    });

    return logger;
};

// TODO: HTTP COPY

proto.debug = false;

/** Export to CommonJS */
module.exports = Object.create(proto, {
    url: {
        get: function () {
            return url.format(this._url);
        },
        set: function (v) {
            this._url = typeof v === "string" ? url.parse(v) : v;
        }
    },
    debug: {
        get: function () {
            return this._debug ? this._debug.level : false;
        },
        set: function (v) {
            this._debug = (v in consoleMap) ? consoleMap[v] : false;
        }
    }
});
