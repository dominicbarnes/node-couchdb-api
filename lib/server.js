/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */

/** Module Dependencies */
var Client = require("./client"),
	Database = require("./database"),
	qs = require("querystring"),
	url = require("url"),
	_ = require("underscore");

/**
 * @class Document
 * Handles interaction at the server level
 */
function Server(host, port) {
	// use this as the basis for our urlObj
	var urlObj = url.parse("http://localhost:5984/");

	// if host provided, augment the urlObj
	if (host) {
		urlObj.hostname = host;
	}

	// if port provided, augment the urlObj
	if (port) {
		urlObj.port = port;
	}

	// delete placeholders to help .url()
	delete urlObj.href;
	delete urlObj.host;

	this.urlObj = urlObj; // add a public reference

	this.client = new Client(); // create a client for each server
}

/** @augments Server */
_.extend(Server.prototype, require("./request"));

/**
 * Get basic information about the server
 *
 * `GET /`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.info = function (callback) {
	this.req("get", callback);
};

/**
 * Get a list of all the databases on the server
 *
 * `GET /_all_dbs`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, dbs`)
 */
Server.prototype.allDbs = function (callback) {
	this.req("get", "_all_dbs", callback);
};

/**
 * Get information about all the active tasks currently running on the server
 *
 * `GET /_active_tasks`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, tasks`)
 */
Server.prototype.activeTasks = function (callback) {
	this.req("get", "_active_tasks", callback);
};

/**
 * Get the text of the server's log file
 *
 * `GET /_log`
 *
 * @param {object} query       Query arguments to be passed
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.log = function (query, callback) {
	if (typeof query === "function") {
		callback = query;
		query = null;
	}

	if (!query) {
		this.req("get", "_log", callback);
	} else {
		this.req("get", {
			pathname: "_log",
			query: query
		}, callback);
	}
};

/**
 * Restarts the server process
 *
 * `GET /_restart`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.restart = function (callback) {
	this.req("post", "_restart", callback);
};

/**
 * Restarts the server process
 *
 * `GET /_restart`
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.stats = function (callback) {
	this.req("get", "_stats", callback);
};

/**
 * Get a list of generated UUIDs from the server
 *
 * `GET /_uuids`
 *
 * @param {number} [count]     Number of UUIDs to be returned (default: 1)
 * @param {function} callback  Callback to be performed (arguments: `err, uuids`)
 */
Server.prototype.uuids = function (count, callback) {
	var self = this;

	if (typeof count === "function") {
		callback = count;
		count = 1;
	}

	this.req("get", {
		pathname: "_uuids",
		query: { count: count || 5 }
	}, function (err, response) {
		callback.call(self, null, response.uuids);
	});
};

/**
 * Specify a username/password to send to the server with each request (uses HTTP Basic auth)
 *
 * @param {string} user  Username (either server admin or `_users` user)
 * @param {string} pass  Password
 */
Server.prototype.setUser = function (user, pass) {
	this.client.user = {
		name:     user,
		password: pass
	};
};

/**
 * Attempt a login against the server itself
 *
 * @param {string} user        Username
 * @param {string} pass        Password
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.login = function (user, pass, callback) {
	var self = this, body, options;

	body = {
		name: user,
		password: pass
	};

	options = {
		headers: {
			"content-type": "application/x-www-form-urlencoded"
		}
	};

	this.req("post", "_session", body, options, function (err, response) {
		if (!err) {
			self.client.user = {
				ctx:      _.clone(response),
				name:     user,
				password: pass
			};
		}

		callback.apply(self, arguments);
	});
};

/**
 * Logout (destroy the session)
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.logout = function (callback) {
	this.req("del", "_session", callback);
};

/**
 * Check the status of the current session
 *
 * @param {function} callback  Callback to be performed (arguments: `err, response`)
 */
Server.prototype.session = function (callback) {
	this.req("get", "_session", callback);
};

/**
 * Performs a replication from this database to the specified dest db
 *
 * `POST /_replicate`
 *
 * @param {string|object} source  Either a string name/url for the source database, or another couchdb-api db object
 * @param {string|object} target  Either a string name/url for the target database, or another couchdb-api db object
 * @param {object} opts           Query options for the command
 */
Server.prototype.replicate = function (source, target, opts, callback) {
	opts = opts || {};

	try {
		if (!_.isString(source)) {
			if (source.constructor.name !== "Database") {
				throw "Source is not a Database object";
			}

			source = _.isEqual(source.server, this) ? source.name : source.url();
		}

		if (!_.isString(target)) {
			if (target.constructor.name !== "Database") {
				throw "Source is not a Database object";
			}

			target = _.isEqual(target.server, this) ? target.name : target.url();
		}

		opts.source = source;
		opts.target = target;

		this.req("post", "_replicate", opts, callback)
	} catch (e) {
		callback.call(this, e);
	}
};

/**
 * Returns a new Database object
 *
 * @param {string} name  The Database name
 * @return {object}      A new Database object
 */
Server.prototype.db = function (name) {
	return new Database(this, name);
};

/** Export to CommonJS */
module.exports = Server;
