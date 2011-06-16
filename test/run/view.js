var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port),
	db = server.db(config.name("db")),
	ddoc = db.ddoc(config.name("ddoc")),
	doc_count = 10,
	view_map_name = config.name("view_map"),
	view_map = ddoc.view(view_map_name),
	view_reduce_name = config.name("view_reduce"),
	view_reduce = ddoc.view(view_reduce_name),
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		var count = 0;

		function save(err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}

			if (++count >= doc_count + 1) {
				test.done();
			}
		}

		test.expect(4 + (2 * doc_count));
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.create(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}

			for (var x = 0; x < doc_count; x++) {
				db.doc(config.name("doc")).save(save);
			}

			ddoc.view(view_map_name, function (doc) { emit(doc._id, null); });
			ddoc.view(view_reduce_name, function (doc) { emit(doc._id, null); }, "_count");
			ddoc.list("test", function (head, req) { provides("html", function () { return "test successful"; }); });
			ddoc.save(save);
		});
	},

	suite: {
		query: function (test) {
			test.expect(2);
			view_map.query(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(response.total_rows, doc_count);
				}
				test.done();
			});
		},
		querystring: function (test) {
			view_map.query({ include_docs: true }, function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.rows[0].doc);
				}
				test.done();
			});
		},
		map: function (test) {
			test.expect(2);
			view_reduce.map(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(response.total_rows, doc_count);
				}
				test.done();
			});
		},
		reduce: function (test) {
			test.expect(2);
			view_reduce.reduce(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(response.rows[0].value, doc_count);
				}
				test.done();
			});
		},
		list: function (test) {
			test.expect(2);
			view_map.list("test", function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(response, "test successful");
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
