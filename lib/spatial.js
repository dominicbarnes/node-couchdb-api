var client = require("./client"),
    doc = require("./document");

// inherit from client
var proto = Object.create(client);

// dependent on url
Object.defineProperty(proto, "name", {
    get: function () {
        return this._url.path.split("/")[5];
    },
    set: function (v) {
        var path = this._url.path.split("/");
        path[5] = v;
        this._url.path = this._url.pathname = path.join("/");
    }
});

/**
 * Perform a generic query against a stored spatial
 *
 * GET /db/ddoc/_spatial/spatial
 *
 * @param {object} [query]     If only one of the optional params is provided, this is assumed to be the one
 * @param {mixed} [data]       Array = pass as `keys` in body. Other = pass as complete body
 * @param {function} callback
 *
 * @return {object} this
 */
proto.query = function (query, data, callback) {
    if (typeof query === "function") {
        callback = query;
		data     = null;
        query    = null;
    }
	if (typeof data === "function") {
		callback = data;
        data = null;
	}

    var opts = { query: query || {} };

	if (data) {
        return this._post(opts, Array.isArray(data) ? { keys: data } : data, callback);
	} else {
		return this._get(opts, callback);
    }
};

/**
 * Perform a map query against a stored spatial
 *
 * GET /db/ddoc/_spatial/spatial
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.map = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = {};
    }

    query.reduce = false;

    return this.query(query, callback);
};

/**
 * Perform a reduce query against a stored spatial
 *
 * GET /db/ddoc/_spatial/spatial
 *
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.reduce = function (query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = {};
    }

    query.reduce = true;

    return this.query(query, callback);
};

/**
 * Execute a list function for the current document
 *
 * GET /db/_design/design-doc/_list/list-name/doc
 *
 * @param {string} list        The name of the list function in the above design document
 *                                `ddoc/list` ...or... `list` if using same design document as this spatial
 * @param {object} [query]
 * @param {function} callback
 *
 * @return {object} this
 */
proto.list = function (list, query, callback) {
    if (typeof query === "function") {
        callback = query;
        query = null;
    }

    var list_ddoc, spatial, path, url;

    if (list.indexOf("/") > -1) {
        list = list.split("/");
        list_ddoc = list[0];
        list = list[1];
        spatial = this.ddoc.name + "/" + this.name;
    } else {
        list_ddoc = this.ddoc.name;
        spatial = this.name;
    }

    path = ["", this.db.name, "_design", list_ddoc, "_list", list, spatial];
    url = {
        replace: true,
        pathname: path.join("/")
    };

    if (query) {
        url.query = query;
    }

    return this._get(url, callback);
};

/**
 * Create a new spatial object
 *
 * @param {object} ddoc
 * @param {string} name
 *
 * @return {object} spatial
 */
exports.create = function (ddoc, name) {
    var spatial = Object.create(proto);

    spatial.ddoc = ddoc;
    spatial.db = ddoc.db;
    spatial.server = ddoc.server;
    spatial.url = ddoc.url + "/_spatial/" + name;
    spatial.debug = ddoc.debug;

    return spatial;
};
