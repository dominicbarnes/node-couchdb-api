var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_ddoc"),
    ddoc = db.ddoc("test_ddoc_1"),
    noop = function () {};

module.exports = {
    before: function (done) {
        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        db.create(function (err, response) {
            ddoc.save(done);
        });
    },

    after: function (done) {
        db.drop(done);
    },

    "Design Document": {
        "Information": function (done) {
            var ret = ddoc.info(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.equal(ddoc.name, response.name);
                }
                done();
            });
            test.strictEqual(ddoc, ret);
        },
        "Views": function (done) {
            test.ifError(ddoc.body.views); // make sure views doesn't exist on our new doc

            var views = ddoc.views(),
                viewName = "test_view_1",
                ret = ddoc.view(viewName, noop);

            test.ok(views[viewName].map);
            test.ok(typeof views[viewName].map === "string");
            test.ifError(views[viewName].reduce);
            test.strictEqual(ddoc, ret);

            viewName = "test_view_2";
            ret = ddoc.view(viewName, noop, noop);
            test.ok(views[viewName].map);
            test.ok(typeof views[viewName].map === "string");
            test.ok(views[viewName].reduce);
            test.ok(typeof views[viewName].reduce === "string");
            test.strictEqual(ddoc, ret);

            test.strictEqual(ddoc.body.views, views);
            test.equal(_.size(ddoc.body.views), 2);

            ddoc.views(null);
            test.ifError(ddoc.body.views);

            views = {
                myview: {
                    map: noop,
                    reduce: noop
                }
            };

            ddoc.views(views);
            test.ok(ddoc.body.views);                  // did it set the object?
            test.ok(views.myview.map);
            test.ok(typeof views.myview.map === "string");
            test.ok(views.myview.reduce);
            test.ok(typeof views.myview.reduce === "string");
            test.strictEqual(ddoc, ret);
            test.strictEqual(ddoc.body.views, views);  // is it the same?

            done();
        },
        "Shows": function (done) {
            test.ifError(ddoc.body.shows);

            var shows = ddoc.shows(),
                showName = "test_show_1",
                ret = ddoc.show(showName, noop);

            test.ok(shows[showName]);
            test.ok(typeof shows[showName] === "string");
            test.equal(_.size(shows), 1);
            test.strictEqual(ddoc, ret);
            test.strictEqual(ddoc.body.shows, shows);

            ddoc.shows(null);
            test.ifError(ddoc.body.shows);

            shows = { myshow: noop };
            ddoc.shows(shows);
            test.strictEqual(ddoc.body.shows, shows);
            test.ok(typeof shows.myshow === "string");

            done();
        },
        "Lists": function (done) {
            test.ifError(ddoc.body.lists);

            var lists = ddoc.lists(),
                listName = "test_list_1",
                ret = ddoc.list(listName, noop);

            test.ok(lists[listName]);
            test.ok(typeof lists[listName] === "string");
            test.strictEqual(ddoc, ret);
            test.strictEqual(ddoc.body.lists, lists);

            ddoc.lists(null);
            test.ifError(ddoc.body.lists);

            lists = {
                mylist: noop
            };
            ddoc.lists(lists);
            test.ok(ddoc.body.lists);
            test.ok(typeof lists.mylist === "string");
            test.strictEqual(ddoc.body.lists, lists);

            done();
        },
        "Update Handlers": function (done) {
            test.ifError(ddoc.body.updates);

            var updates = ddoc.updates(),
                updateName = "test_list_2",
                ret = ddoc.update(updateName, noop);

            test.ok(updates[updateName]);
            test.ok(typeof updates[updateName] === "string");
            test.strictEqual(ddoc, ret);
            test.strictEqual(ddoc.body.updates, updates);

            ddoc.updates(null);
            test.ifError(ddoc.body.updates);

            updates = {
                myupdate: noop
            };
            ddoc.updates(updates);
            test.ok(ddoc.body.updates.myupdate);
            test.ok(typeof updates.myupdate === "string");
            test.strictEqual(ddoc.body.updates, updates);

            done();
        },
        "Validation": function (done) {
            test.ifError(ddoc.body.validate_doc_update);

            var ret = ddoc.val(noop);
            test.strictEqual(ddoc, ret);
            test.ok(typeof ddoc.body.validate_doc_update === "string");

            test.strictEqual(ddoc.body.validate_doc_update, ddoc.val());
            done();
        }
    }
};
