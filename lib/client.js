/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
	http = require('http'),
	url = require('url'),
	qs = require("querystring"),
	crypto = require("crypto"),
	sha1 = crypto.createHash("sha1"),
	cookie = require("./cookie"),
	Vargs = require("vargs").Constructor;

/**
 * @class Client
 * The Client deals with all the HTTP communication with CouchDB.
 * It will handle content-negotiation and response.
 */
function Client() {}

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
		"accept": ["text/plain", "application/json", "application/x-www-form-urlencoded", "text/html"].join(", ")
	});

	opts.method = opts.method.toUpperCase();

	opts.host = urlObj.hostname;
	opts.port = urlObj.port;
	opts.path = urlObj.pathname;
	if (urlObj.query) {
		opts.path += "?" + qs.stringify(urlObj.query);
	}

	if (this.user) {
		opts.headers.authorization = "Basic " + new Buffer(this.user.name + ":" + this.user.password).toString("base64");
	}

	if (this.debug) {
		console.log(opts);
	}

	var req = http.request(opts, function (res) {
		var response = "";

		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			response += chunk;
		});

		res.on('end', function () {
			var result = response;

			switch (res.headers["content-type"]) {
			case "application/json":
				result = JSON.parse(result);
				break;

			case "application/x-www-form-urlencoded":
				result = qs.parse(result);
				break;
			}

			if (res.statusCode >= 200 && res.statusCode < 300) {
				callback.call(self, null, result, res.headers, res.statusCode);
			} else {
				callback.call(self, result, null, res.headers, res.statusCode);
			}

			if (self.debug) {
				console.log(result, res.headers, res.statusCode);
			}
		});
	});

	if (opts.body) {
		var body = opts.body;
		switch (opts.headers["content-type"]) {
		case "application/json":
			body = JSON.stringify(body);
			break;

		case "application/x-www-form-urlencoded":
			body = qs.stringify(body);
			break;
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

/** Export to CommonJS */
module.exports = Client;
