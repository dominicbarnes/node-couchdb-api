var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port),
	testusername = "testuser",
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		test.done();
	},

	suite: {
		info: function (test) {
			test.expect(2);
			server.info(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(response.couchdb, "Welcome");
				}
				test.done();
			});
		},
		allDbs: function (test) {
			test.expect(2);
			server.allDbs(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(_.isArray(response));
				}
				test.done();
			});
		},
		activeTasks: function (test) {
			test.expect(2);
			server.activeTasks(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(_.isArray(response));
				}
				test.done();
			});
		},
		log: function (test) {
			test.expect(2);
			server.log(function (err, response, headers) {
				test.ifError(err);
				if (response) {
					test.ok(response);
				}
				test.done();
			});
		},
		stats: function (test) {
			test.expect(2);
			server.stats(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.couchdb);
				}
				test.done();
			});
		},
		uuids: function (test) {
			var finish = false;
			test.expect(4);

			server.uuids(function (err, uuids) {
				test.ifError(err);
				if (uuids) {
					test.equal(uuids.length, 1);
				}

				if (finish) {
					test.done();
				} else {
					finish = true;
				}
			});

			server.uuids(10, function (err, uuids) {
				test.ifError(err);
				if (uuids) {
					test.equal(uuids.length, 10);
				}

				if (finish) {
					test.done();
				} else {
					finish = true;
				}
			});
		},
		register: function (test) {
			server.register(testusername, "password", function (err, response) {
				test.ifError(err);
				server.db("_users").doc(response.id).get(function (err, doc) {
					test.ifError(err);
					test.equal(doc.name, testusername);
					test.done();
				});
			});
		}
	},

	tearDown: function (test) {
		var user = server.db("_users").doc("org.couchdb.user:" + testusername);

		user.get(function (err, doc) {
			user.del(function (err, response) {
				test.done();
			});
		});
	}
};
