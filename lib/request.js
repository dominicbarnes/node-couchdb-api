/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
	url = require("url");

/** @private */
function modifyUrl(oldUrl, newUrl) {
	var urlObj = _.clone(oldUrl);

	if (!newUrl) {
		return urlObj;
	} else if (_.isString(newUrl)) {
		newUrl = url.parse(newUrl);
	}

	if (newUrl.pathname) {
		if (newUrl.replace) {
			urlObj.pathname = newUrl.pathname;
		} else {
			urlObj.pathname += newUrl.pathname;
		}
	}
	if (newUrl.query) {
		urlObj.query = urlObj.query || {};
		if (newUrl.replace) {
			urlObj.query = _.clone(newUrl.query);
		} else {
			_.extend(urlObj.query, newUrl.query);
		}
	}

	return urlObj;
}

/**
 * Pass along a request to the underlying Client object, using the current objects urlObj as the base
 * Returns `this` in order to be made chainable
 */
function req() {
	var args = _.toArray(arguments),
		method = args.shift().toLowerCase();

	if (args.length > 1) {
		args[0] = modifyUrl(this.urlObj, args[0]);
	} else {
		args.unshift(this.urlObj);
	}

	this.client[method].apply(this.client, args);

	return this;
}

/**
 * Enable debug mode for the client object (not very useful externally right now)
 *
 * @param {string} level  Outputs logs at and above the specified level (debug, info, warn, error)
 */
function debug(level) {
	this.client.log.level(level);
}

/**
 * Retrieve the string URL for the current object
 */
function getUrl() {
	return url.format(this.urlObj);
}

/** More efficient mixin */
module.exports = (function () {
	return function () {
		this.req = req;
		this.debug = debug;
		this.url = getUrl;
		return this;
	};
}());
