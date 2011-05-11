module.exports = {
	Server: require("./lib/server"),
	Database: require("./lib/database"),
	Document: require("./lib/document"),
	DesignDocument: require("./lib/designDocument"),

	srv: function (host, port) {
		return new this.Server(host, port);
	}
};
