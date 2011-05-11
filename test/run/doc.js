var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port),
	db = server.db(config.name("db")),
	doc = db.doc(config.name("doc")),
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
		save: function (test) {
			test.expect(2);
			doc.body.hello = "world";
			doc.save(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		},
		get: function (test) {
			test.expect(2);
			doc.get(function (err, doc) {
				test.ifError(err);
				if (doc) {
					test.equal(doc.hello, "world");
				}
				test.done();
			});
		},
		del: function (test) {
			test.expect(2);
			doc.del(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}
				test.done();
			});
		}
	},

	tearDown: function (test) {
		test.expect(2);
		db.drop(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}
			test.done();
		});
	}
};
