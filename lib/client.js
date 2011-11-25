/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
	http = require("http"),
	url = require("url"),
	qs = require("querystring"),
	content = require("./content"),
	crypto = require("crypto"),
	cookie = require("./cookie"),
	Vargs = require("vargs").Constructor,
	Log = require("./log");

/**
 * @class Client
 * The Client deals with all the HTTP communication with CouchDB.
 * It will handle content-negotiation and response.
 */
function Client(log, cache) {
	this.log = new Log(log || "none");
	this.cache = (_.isUndefined(cache) || !!cache) ? {} : false;
}

/**
 * Performs an HTTP request
 *
 * @param {object} urlObj       Object returned from url.parse()
 * @param {object} [options]    HTTP request configuration
 * @param {function} callback   Callback for HTTP response
 */
Client.prototype.request = function (urlObj, options, callback) {
	var self = this,
		opts = _.clone(options),
		uri;

	_.defaults(opts, {
		method: "GET",
		headers: {}
	});

	_.defaults(opts.headers, {
		"content-type": "application/json",
		"accept": _.keys(content).join(", ")
	});

	opts.method = opts.method.toUpperCase();

	opts.host = urlObj.hostname;
	opts.port = urlObj.port;
	opts.path = urlObj.pathname;
	if (urlObj.query) {
		_.each(urlObj.query, function (value, key, list) {
			switch (key) {
			case "key":
			case "startkey":
			case "endkey":
				list[key] = JSON.stringify(value);
				break;
			}
		});
		opts.path += "?" + qs.stringify(urlObj.query);
	}

	uri = url.format(urlObj);

	var logIntro = this.log.colorize("#blue[#bold[" + opts.method + "]]") + " " + this.log.colorize("bold", url.format(urlObj));

	if (this.user) {
		this.log.info(logIntro, "Using HTTP Authentication");
		opts.headers.authorization = "Basic " + new Buffer(this.user.name + ":" + this.user.password).toString("base64");
	}

	var cacheEntry = this.cache && this.cache[uri];

	if (!opts.stream && cacheEntry) {
		this.log.info(logIntro, "Sending Etag with Request", cacheEntry.etag);
		opts.headers["if-none-match"] = cacheEntry.etag;
	}

	this.log.info(logIntro);
	this.log.debug(logIntro, "Options for Request", opts);

	var req = http.request(opts, (function () {
		if (opts.stream) {
			self.log.debug(logIntro, "Streamed Response");

			return function (res) {
				if (opts.changes) {
					res.setEncoding("utf8");
				}

				callback.call(self, null, res);

				res.on("data", function (chunk) {
					self.log.debug(logIntro, "Chunk Received", chunk.length, chunk);

					if (opts.changes) {
						chunk = chunk.trim();

						if (chunk) {
							chunk = JSON.parse(chunk);

							if (chunk.seq) {
								self.log.info(logIntro, "Change Emitted", chunk);
								res.emit("change", chunk);
							}
						}
					}
				});

				res.on("end", function () {
					self.log.info(logIntro, "Response Stream End");
				});

				res.on("error", function (e) {
					self.log.error(logIntro, "HTTP Error", e);
				});
			};
		} else {
			return function (res) {
				var response = "";

				res.setEncoding("utf8");

				res.on("data", function (chunk) {
					self.log.debug(logIntro, "Chunk received", chunk);
					response += chunk;
				});

				res.on("end", function () {
					self.log.debug(logIntro, "Done collecting response");
					var result = response, handler = content[res.headers["content-type"]];

					if (handler && handler.parse) {
						result = handler.parse(result);
					}

					if (res.statusCode >= 200 && res.statusCode < 300) {
						self.log.info(logIntro, "Successful CouchDB Request");

						if (opts.method === "GET" && res.headers.etag) {
							self.log.info(logIntro, "Adding Response to Etag Cache", res.headers.etag);
							self.cache[uri] = {
								etag: res.headers.etag,
								body: result
							};
						}

						callback.call(self, null, result, res);
					} else if (res.statusCode === 304) {
						self.log.info(logIntro, "Etag matched, using cached version");
						callback.call(self, null, self.cache[uri].body, res);
					} else {
						self.log.error(logIntro, "CouchDB returned an error", result);
						callback.call(self, result, null, res);
					}
				});

				res.on("error", function (e) {
					self.log.error(logIntro, "HTTP Error", e);
				});
			};
		}
	}()));

	if (opts.body) {
		this.log.info(logIntro, "Sending a Body with Request");

		var body = opts.body,
			handler = content[opts.headers["content-type"]];

		if (Buffer.isBuffer(body)) {
			self.log.info(logIntro, "Converting from Buffer to String");
			body = body.toString();
		}

		if (handler && handler.format) {
			body = handler.format(body);
		}

		this.log.debug(logIntro, "Request Body", body);

		if (body.readable) {
			body.on("data", function (chunk) {
				self.log.debug(logIntro, "Request Body Chunk", chunk.length, chunk);
				req.write(chunk);
			});
			body.on("end", function () {
				self.log.debug(logIntro, "Request Body Stream End");
				req.end();
			});
			return;
		}

		req.write(body);
	}

	req.end();
};

/**
 * Performs an HTTP GET request
 *
 * @param {object} urlObj      Object returned from url.parse()
 * @param {object} [options]   HTTP request configuration
 * @param {function} callback  Callback for HTTP response
 */
Client.prototype.get = function () {
	var args = new Vargs(arguments),
		urlObj = args.first,
		options = args.all[1] || {};

	options.method = "GET";

	this.request(urlObj, options, args.callback);
};

/**
 * Performs an HTTP PUT request
 *
 * @param {object} urlObj       Object returned from url.parse()
 * @param {string|object} body  Body of request (string, json object, qs object, etc.)
 * @param {object} [options]    HTTP request configuration
 * @param {function} callback   Callback for HTTP response
 */
Client.prototype.put = function () {
	var args = new Vargs(arguments),
		urlObj = args.first,
		body = args.all[1] || null,
		options = args.all[2] || {};

	options.method = "PUT";
	if (body) {
		options.body = body;
	}

	this.request(urlObj, options, args.callback);
};

/**
 * Performs an HTTP POST request
 *
 * @param {object} urlObj       Object returned from url.parse()
 * @param {string|object} body  Body of request (string, json object, qs object, etc.)
 * @param {object} [options]    HTTP request configuration
 * @param {function} callback   Callback for HTTP response
 */
Client.prototype.post = function () {
	var args = new Vargs(arguments),
		urlObj = args.first,
		body = args.all[1] || null,
		options = args.all[2] || {};

	options.method = "POST";
	if (body) {
		options.body = body;
	}

	this.request(urlObj, options, args.callback);
};

/**
 * Performs an HTTP DELETE request
 *
 * @param {object} urlObj      Object returned from url.parse()
 * @param {object} [options]   HTTP request configuration
 * @param {function} callback  Callback for HTTP response
 */
Client.prototype.del = function () {
	var args = new Vargs(arguments),
		urlObj = args.first,
		options = args.all[1] || {};

	options.method = "DELETE";

	this.request(urlObj, options, args.callback);
};

// TODO: HTTP COPY (for CouchDB)

/** Export to CommonJS */
module.exports = Client;
