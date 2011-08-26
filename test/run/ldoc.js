var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	db = server.db(config.name("db")),
	ldoc = db.ldoc(config.name("ldoc")),
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		server.debug(config.log_level);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.create(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}
			ldoc.save(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		});
	},
	suite: {
		get: function (test) {
			ldoc.get(function (err, response) {
				test.ifError(err);
				test.ok(response);
				test.done();
			});
		}
	},
	tearDown: function (test) {
		db.drop(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}
			test.done();
		});
	}
};
