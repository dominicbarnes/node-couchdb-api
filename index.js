// dependencies
var url = require("url");
var Server = require("./lib/server");

/**
 * Creates an instance based on the input URL. If only a protocol+host is provided, it will return a Server instance.
 * If a path is included, it will return a database instance. (ignoring the rest of the path)
 *
 * If nothing is provided, it will return a Server using http://localhost:5984
 *
 * @param {String} [href]
 * @returns {Server|Database}
 */
module.exports = exports = function (href) {
    if (!href) return new Server();

    var parsed = url.parse(href);

    var srv = new Server(url.format({
        protocol: parsed.protocol,
        auth: parsed.auth,
        hostname: parsed.hostname,
        port: parsed.port
    }));

    var path = parsed.pathname.slice(1);
    if (!path) return srv;

    return srv.db(path.split("/").pop());
};

// expose the constructors
exports.Server = Server;
exports.Database = require("./lib/database");
exports.Document = require("./lib/document");
exports.DesignDocument = require("./lib/design-document");
exports.LocalDocument = require("./lib/local-document");
exports.View = require("./lib/view");
