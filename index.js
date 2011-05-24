module.exports = {
	Server: require("./lib/server"),
	Database: require("./lib/database"),
	Document: require("./lib/document"),
	DesignDocument: require("./lib/designdocument"),
	View: require("./lib/view"),

	srv: function (host, port) {
		return new this.Server(host, port);
	}
};
