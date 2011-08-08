var url = require("url");

module.exports = {
	Server: require("./lib/server"),
	Database: require("./lib/database"),
	Document: require("./lib/document"),
	DesignDocument: require("./lib/designdoc"),
	LocalDocument: require("./lib/localdoc"),
	View: require("./lib/view"),

	/* TODO: parse URL into resource object
	get: function (url) {
		url = url.parse(url);
	},
	*/

	srv: function (host, port) {
		return new this.Server(host, port);
	},
	db: function (name) {
		return this.srv().db(name);
	}
};
