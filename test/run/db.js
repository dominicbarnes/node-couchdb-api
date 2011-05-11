var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port),
	db = server.db(config.name("db")),
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		test.expect(2);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.create(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}
			test.done();
		});
	},

	suite: {
		info: function (test) {
			test.expect(2);
			db.info(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(db.name, response.db_name);
				}
				test.done();
			});
		},
		changes: function (test) {
			test.expect(2);
			db.changes({}, function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response);
				}
				test.done();
			});
		},
		compact: function (test) {
			test.expect(2);
			db.compact(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		},
		viewCleanup: function(test) {
			test.expect(2);
			db.viewCleanup(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		},
		ensureFullCommit: function (test) {
			test.expect(2);
			db.ensureFullCommit(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		}
	},

	tearDown: function (test) {
		db.drop(function (err, response) {
			test.done();
		});
	}
};
