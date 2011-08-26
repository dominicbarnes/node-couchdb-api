var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	testusername = "testuser",
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		server.debug(config.log_level);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		test.done();
	},

	suite: {
		info: function (test) {
			var ret = server.info(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(response.couchdb, "Welcome");
				}
				test.done();
			});
			test.strictEqual(server, ret);
		},
		allDbs: function (test) {
			var ret = server.allDbs(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(_.isArray(response));
				}
				test.done();
			});
			test.strictEqual(server, ret);
		},
		activeTasks: function (test) {
			var ret = server.activeTasks(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(_.isArray(response));
				}
				test.done();
			});
			test.strictEqual(server, ret);
		},
		log: function (test) {
			var ret = server.log(function (err, response, headers) {
				test.ifError(err);
				if (response) {
					test.ok(response);
				}
				test.done();
			});
			test.strictEqual(server, ret);
		},
		stats: function (test) {
			var ret = server.stats(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.couchdb);
				}
				test.done();
			});
			test.strictEqual(server, ret);
		},
		uuids: function (test) {
			var finish = false;

			server
				.uuids(function (err, uuids) {
					test.ifError(err);
					if (uuids) {
						test.equal(uuids.length, 1);
					}

					if (finish) {
						test.done();
					} else {
						finish = true;
					}
				})
				.uuids(10, function (err, uuids) {
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
		userDoc: {
			"No Options": function (test) {
				var user = server.userDoc(testusername, "bar");
				test.equal(user._id, "org.couchdb.user:" + testusername);
				test.equal(user.name, testusername);
				test.ok(user.salt);
				test.ok(user.password_sha);
				test.ok(user.roles);
				test.equal(user.type, "user");
				test.done();
			},
			"Options with Salt": function (test) {
				var user = server.userDoc(testusername, "bar", { salt: "my secret" });
				test.equal(user._id, "org.couchdb.user:" + testusername);
				test.equal(user.name, testusername);
				test.equal(user.salt, "my secret");
				test.ok(user.password_sha);
				test.ok(user.roles);
				test.equal(user.type, "user");
				test.done();
			},
			"Options with Roles": function (test) {
				var user = server.userDoc(testusername, "bar", { roles: ["user", "test"] });
				test.equal(user._id, "org.couchdb.user:" + testusername);
				test.equal(user.name, testusername);
				test.ok(user.salt);
				test.ok(user.password_sha);
				test.equal(user.roles.length, 2);
				test.equal(user.type, "user");
				test.done();
			}
		},
		register: function (test) {
			var ret = server.register(testusername, "password", function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
			test.strictEqual(server, ret);
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
