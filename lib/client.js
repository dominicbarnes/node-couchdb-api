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
	sha1 = crypto.createHash("sha1"),
	cookie = require("./cookie"),
	Vargs = require("vargs").Constructor,
	Log = require("./log");

/**
 * @class Client
 * The Client deals with all the HTTP communication with CouchDB.
 * It will handle content-negotiation and response.
 */
function Client(log) {
	this.log = new Log(log || "none");
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
		opts = _.clone(options);

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

	var logIntro = this.log.colorize("#blue[#bold[" + opts.method + "]]") + " " + this.log.colorize("bold", url.format(urlObj));

	if (this.user) {
		this.log.info(logIntro, "Using HTTP Authentication");
		opts.headers.authorization = "Basic " + new Buffer(this.user.name + ":" + this.user.password).toString("base64");
	}

	this.log.info(logIntro);
	this.log.debug(logIntro, "Options for Request", opts);

	var req = http.request(opts, function (res) {
		var response = "";

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			self.log.debug(logIntro, "Chunk received", chunk);
			response += chunk;
		});

		res.on('end', function () {
			self.log.debug(logIntro, "Done collecting response");
			var result = response, handler = content[res.headers["content-type"]];

			if (handler && handler.parse) {
				result = handler.parse(result);
			}

			if (res.statusCode >= 200 && res.statusCode < 300) {
				self.log.info(logIntro, "Successful CouchDB Request");
				callback.call(self, null, result, res);
			} else {
				self.log.warn(logIntro, "CouchDB returned an error", result);
				callback.call(self, result, null, res);
			}
		});
	});

	if (opts.body) {
		this.log.info(logIntro, "Sending a Body with Request");

		var body = opts.body, handler = content[opts.headers["content-type"]];

		if (handler && handler.format) {
			body = handler.format(body);
		}

		this.log.debug(logIntro, "Request Body", body);
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
