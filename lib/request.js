/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var _ = require("underscore"),
	url = require("url");

/** @private */
function modifyUrl(oldUrl, newUrl) {
	urlObj = _.clone(oldUrl);

	if (!newUrl) {
		return urlObj;
	} else if (_.isString(newUrl)) {
		newUrl = url.parse(newUrl);
	}

	if (newUrl.pathname) {
		urlObj.pathname += newUrl.pathname;
	}
	if (newUrl.query) {
		urlObj.query = urlObj.query || {};
		_.extend(urlObj.query, newUrl.query);
	}

	return urlObj;
}

/** Pass along a request to the underlying Client object, using the current objects urlObj as the base */
function req() {
	var args = _.toArray(arguments),
		method = args.shift().toLowerCase();

	if (args.length > 1) {
		args[0] = modifyUrl(this.urlObj, args[0]);
	} else {
		args.unshift(this.urlObj);
	}

	this.client[method].apply(this.client, args);
}

/**
 * Enable debug mode for the client object (not very useful externally right now)
 *
 * @param {bool} [status]  If passed, will use this to set the flag, otherwise it defaults to true
 */
function debug(status) {
	this.client.debug = typeof status === "undefined" ? true : !!status;
}

/**
 * Retrieve the string URL for the current object
 */
function url() {
	return url.format(this.urlObj);
}

/** More efficient mixin */
module.exports = (function () {
	return function () {
		this.req = req;
		this.debug = debug;
		this.url = url;
		return this;
	};
})();
