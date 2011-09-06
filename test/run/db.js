var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	db = server.db(config.name("db")),
	db2 = server.db(config.name("db")),
	db3 = server.db(config.name("db")),
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
			test.done();
		});
	},

	suite: {
		info: function (test) {
			var ret = db.info(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(db.name, response.db_name);
				}
				test.done();
			});
			test.strictEqual(db, ret);
		},
		changes: {
			query: function (test) {
				var ret = db.changes({}, function (err, response) {
					test.ifError(err);
					if (response) {
						test.ok(response);
					}
					test.done();
				});
				test.strictEqual(db, ret);
			},
			stream: function (test) {
				var ret = db.changes({ timeout: 250, feed: "continuous" }, function (err, stream) {
					test.ifError(err);

					if (stream) {
						var changes = 0;
						stream.on("change", function (change) {
							changes++;
						});

						stream.on("end", function () {
							test.equal(changes, 2);
							test.done();
						});

						db.doc({ foo: "bar" }).save(function () {});
						db.doc({ hello: "world" }).save(function () {});
					}
				});

				test.strictEqual(db, ret);
			}
		},
		compact: function (test) {
			var ret = db.compact(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
			test.strictEqual(db, ret);
		},
		viewCleanup: function(test) {
			var ret = db.viewCleanup(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
			test.strictEqual(db, ret);
		},
		ensureFullCommit: function (test) {
			var ret = db.ensureFullCommit(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
			test.strictEqual(db, ret);
		},
		replicate: {
			object: function (test) {
				var ret = db.replicate(db2, { create_target: true }, function (err, response) {
					test.ifError(err);
					test.ok(response.ok);

					db2.info(function (err, response) {
						test.ifError(err);
						test.done();
					});
				});
				test.strictEqual(db, ret);
			},
			string: function (test) {
				var ret = db.push(db3.name, { create_target: true }, function (err, response) {
					test.ifError(err);
					test.ok(response.ok);

					db3.info(function (err, response) {
						test.ifError(err);
						test.done();
					});
				});
				test.strictEqual(db, ret);
			},
			pull: function (test) {
				var ret = db3.pull(db2, function (err, response) {
					test.ifError(err);
					test.ok(response.ok);
					test.done();
				});
				test.strictEqual(db3, ret);
			}
		},
		security: function (test) {
			var ret = db.security(function (err, response) {
				test.ifError(err);
				test.ok(response);
				test.done();
			});
			test.strictEqual(db, ret);
		},
		tempView: function (test) {
			var map = function (doc) {
				emit(null, doc);
			};

			var ret = db.tempView(map, function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.rows);
				}
				test.done();
			});

			test.strictEqual(db, ret);
		},
		documents: {
			normal: function (test) {
				test.ok(db.doc);
				test.done();
			},
			design: function (test) {
				test.ok(db.ddoc);
				test.ok(db.designDoc);
				test.strictEqual(db.ddoc, db.designDoc);
				test.done();
			},
			local: function (test) {
				test.ok(db.ldoc);
				test.ok(db.localDoc);
				test.strictEqual(db.ldoc, db.localDoc);
				test.done();
			},
			bulk: function (test) {
				var docs = [
					{ foo: "bar" },
					{ hello: "world" },
					{ bah: "humbug" }
				];

				var ret = db.bulkDocs(docs, function (err, response) {
					test.ifError(err);
					if (response) {
						test.equal(response.length, docs.length);
					}
					test.done();
				});

				test.strictEqual(db, ret);
			}
		}
	},

	tearDown: function (test) {
		db.drop(function (err, response) {
			db2.drop(function (err, response) {
				db3.drop(function (err, response) {
					test.done();
				});
			});
		});
	}
};
