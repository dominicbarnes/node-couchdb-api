var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port),
	db = server.db(config.name("db")),
	ddoc = db.ddoc(config.name("ddoc")),
	_ = require("underscore");

module.exports = {
	setUp: function (test) {
		test.expect(4);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.create(function (err, response) {
			test.ifError(err);
			if (response) {
				test.ok(response.ok);
			}

			ddoc.save(function (err, response) {
				test.ifError(err);
				if (response) {
					test.ok(response.ok);
				}

				test.done();
			});
		});
	},
	suite: {
		info: function (test) {
			test.expect(2);
			ddoc.info(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(ddoc.name, response.name);
				}
				test.done();
			});
		},
		views: function (test) {
			test.expect(6);

			test.ifError(ddoc.body.views); // make sure views doesn't exist on our new doc
			var views = ddoc.views();      // initialize the array and return the reference

			var viewName = config.name("view");
			ddoc.view(viewName, function () {}); // add a new view
			test.ok(views[viewName].map);         // make sure the map function is defined
			test.ifError(views[viewName].reduce); // make sure the reduce function is not defined

			viewName = config.name("view");
			ddoc.view(viewName, function () {}, function () {}); // add a new view
			test.ok(views[viewName].map);                         // make sure the map function is defined
			test.ok(views[viewName].reduce);                      // make sure the reduce function is not defined

			test.strictEqual(ddoc.body.views, views);
			test.done();
		},
		shows: function (test) {
			test.expect(4);

			test.ifError(ddoc.body.shows); // make sure shows doesn't exist on our new doc
			var shows = ddoc.shows();      // initialize the array and return the reference

			var showName = config.name("show");
			test.ifError(shows[showName]);       // make sure shows doesn't exist on our new doc
			ddoc.show(showName, function () {}); // add a new show function
			test.ok(shows[showName]);            // test for existance

			test.strictEqual(ddoc.body.shows, shows);

			test.done();
		},
		lists: function (test) {
			test.expect(4);

			test.ifError(ddoc.body.lists); // make sure lists doesn't exist on our new doc
			var lists = ddoc.lists();      // initialize the array and return the reference

			var listName = config.name("list");
			test.ifError(lists[listName]);       // make sure lists doesn't exist on our new doc
			ddoc.list(listName, function () {}); // add a new list function
			test.ok(lists[listName]);            // test for existance

			test.strictEqual(ddoc.body.lists, lists);

			test.done();
		},
		updates: function (test) {
			test.expect(4);

			test.ifError(ddoc.body.updates); // make sure updates doesn't exist on our new doc
			var updates = ddoc.updates();     // initialize the array and return the reference

			var updateName = config.name("list");
			test.ifError(updates[updateName]);       // make sure updates doesn't exist on our new doc
			ddoc.update(updateName, function () {}); // add a new update handler
			test.ok(updates[updateName]);            // test for existance

			test.strictEqual(ddoc.body.updates, updates);

			test.done();
		},
		validation: function (test) {
			test.expect(2);

			test.ifError(ddoc.body.validate_doc_update); // make sure updates doesn't exist on our new doc
			ddoc.val(function () {});                    // add a new view

			test.strictEqual(ddoc.body.validate_doc_update, ddoc.val());
			test.done();
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
