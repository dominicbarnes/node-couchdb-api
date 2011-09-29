var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	db = server.db(config.name("db")),
	ddoc = db.ddoc(config.name("ddoc")),
	noop = function () {},
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
			var ret = ddoc.info(function (err, response) {
				test.ifError(err);
				if (response) {
					test.equal(ddoc.name, response.name);
				}
				test.done();
			});
			test.strictEqual(ddoc, ret);
		},
		views: function (test) {
			test.ifError(ddoc.body.views); // make sure views doesn't exist on our new doc
			var views = ddoc.view();       // initialize the array and return the reference

			var viewName = config.name("view");
			var ret = ddoc.view(viewName, noop);  // add a new view
			test.ok(views[viewName].map);         // make sure the map function is defined
			test.ifError(views[viewName].reduce); // make sure the reduce function is not defined
			test.strictEqual(ddoc, ret);          // test to make sure this is chainable

			viewName = config.name("view");
			ret = ddoc.view(viewName, noop, noop); // add a new view
			test.ok(views[viewName].map);          // make sure the map function is defined
			test.ok(views[viewName].reduce);       // make sure the reduce function is not defined
			test.strictEqual(ddoc, ret);           // test to make sure this is chainable

			test.strictEqual(ddoc.body.views, views);
			test.done();
		},
		shows: function (test) {
			test.ifError(ddoc.body.shows); // make sure shows doesn't exist on our new doc
			var shows = ddoc.show();       // initialize the array and return the reference

			var showName = config.name("show");
			test.ifError(shows[showName]);       // make sure shows doesn't exist on our new doc
			var ret = ddoc.show(showName, noop); // add a new show function
			test.ok(shows[showName]);            // test for existance
			test.strictEqual(ddoc, ret);         // test to make sure this is chainable

			test.strictEqual(ddoc.body.shows, shows);

			test.done();
		},
		lists: function (test) {
			test.ifError(ddoc.body.lists); // make sure lists doesn't exist on our new doc
			var lists = ddoc.list();       // initialize the array and return the reference

			var listName = config.name("list");
			test.ifError(lists[listName]);       // make sure lists doesn't exist on our new doc
			var ret = ddoc.list(listName, noop); // add a new list function
			test.ok(lists[listName]);            // test for existance
			test.strictEqual(ddoc, ret);         // test to make sure this is chainable

			test.strictEqual(ddoc.body.lists, lists);

			test.done();
		},
		updates: function (test) {
			test.ifError(ddoc.body.updates); // make sure updates doesn't exist on our new doc
			var updates = ddoc.update();     // initialize the array and return the reference

			var updateName = config.name("list");
			test.ifError(updates[updateName]);       // make sure updates doesn't exist on our new doc
			var ret = ddoc.update(updateName, noop); // add a new update handler
			test.ok(updates[updateName]);            // test for existance
			test.strictEqual(ddoc, ret);             // test to make sure this is chainable

			test.strictEqual(ddoc.body.updates, updates);

			test.done();
		},
		validation: function (test) {
			test.ifError(ddoc.body.validate_doc_update); // make sure updates doesn't exist on our new doc
			var ret = ddoc.val(noop);                    // set the validation function
			test.strictEqual(ddoc, ret);                 // test to make sure this is chainable

			test.strictEqual(ddoc.body.validate_doc_update, ddoc.val());
			test.done();
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
