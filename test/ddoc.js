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

            var views = ddoc.views(),      // initialize the array and return the reference
                viewName = "test_view_1",
                ret = ddoc.view(viewName, noop);  // add a new view

            test.ok(views[viewName].map);         // make sure the map function is defined
            test.ifError(views[viewName].reduce); // make sure the reduce function is not defined
            test.strictEqual(ddoc, ret);          // test to make sure this is chainable

            viewName = "test_view_2";
            ret = ddoc.view(viewName, noop, noop); // add a new view
            test.ok(views[viewName].map);          // make sure the map function is defined
            test.ok(views[viewName].reduce);       // make sure the reduce function is not defined
            test.strictEqual(ddoc, ret);           // test to make sure this is chainable

            test.strictEqual(ddoc.body.views, views);
            done();
        },
        "Shows": function (done) {
            test.ifError(ddoc.body.shows); // make sure shows doesn't exist on our new doc
            var shows = ddoc.shows(),      // initialize the array and return the reference
                showName = "test_show_1",
                ret = ddoc.show(showName, noop); // add a new show function
            test.ok(shows[showName]);            // test for existance
            test.strictEqual(ddoc, ret);         // test to make sure this is chainable

            test.strictEqual(ddoc.body.shows, shows);

            done();
        },
        "Lists": function (done) {
            test.ifError(ddoc.body.lists); // make sure lists doesn't exist on our new doc
            var lists = ddoc.lists(),      // initialize the array and return the reference
                listName = "test_list_1",
                ret = ddoc.list(listName, noop); // add a new list function
            test.ok(lists[listName]);            // test for existance
            test.strictEqual(ddoc, ret);         // test to make sure this is chainable

            test.strictEqual(ddoc.body.lists, lists);

            done();
        },
        "Update Handlers": function (done) {
            test.ifError(ddoc.body.updates); // make sure updates doesn't exist on our new doc
            var updates = ddoc.updates(),    // initialize the array and return the reference
                updateName = "test_list_2",
                ret = ddoc.update(updateName, noop); // add a new update handler
            test.ok(updates[updateName]);            // test for existance
            test.strictEqual(ddoc, ret);             // test to make sure this is chainable

            test.strictEqual(ddoc.body.updates, updates);

            done();
        },
        "Validation": function (done) {
            test.ifError(ddoc.body.validate_doc_update); // make sure updates doesn't exist on our new doc
            var ret = ddoc.val(noop);                    // set the validation function
            test.strictEqual(ddoc, ret);                 // test to make sure this is chainable

            test.strictEqual(ddoc.body.validate_doc_update, ddoc.val());
            done();
        }
    }
};
