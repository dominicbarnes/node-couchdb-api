var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_view"),
    ddoc = db.ddoc("test_ddoc_1"),
    doc_count = 10,
    view_map_name = "test_view_map_1",
    view_map = ddoc.view(view_map_name),
    view_reduce_name = "test_view_reduce_1",
    view_reduce = ddoc.view(view_reduce_name);

module.exports = {
    before: function (done) {
        var save = _.after(doc_count + 1, done);

        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        db.create(function (err, result) {
            for (var x = 0; x < doc_count; x++) {
                db.doc("test_doc_" + x).save(save);
            }

            ddoc
                .view(view_map_name, function (doc) {
                    emit(doc._id);
                })
                .view(view_reduce_name, function (doc) {
                    emit(doc._id);
                }, "_count")
                .list("test", function (head, req) {
                    provides("html", function () {
                        return "test successful";
                    });
                })
                .save(save);
        });
    },

    after: function (done) {
        db.drop(done);
    },

    "View": {
        "Query": {
            "Basic": function (done) {
                var ret = view_map.query(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.total_rows, doc_count);
                    }
                    done();
                });
                test.strictEqual(view_map, ret);
            },
            "Keys": function (done) {
                var ret = view_map.query(null, ["test_doc_3", "test_doc_4"], function (err, result, res) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.rows.length, 2);
                        test.equal(result.rows[0].id, "test_doc_3");
                        test.equal(result.rows[1].id, "test_doc_4");
                    }
                    done();
                });
            },
            "Options": function (done) {
                var ret = view_map.query({ include_docs: true }, function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.rows[0].doc);
                    }
                    done();
                });
                test.strictEqual(view_map, ret);
            }
        },
        "Specify": {
            "Map": function (done) {
                var ret = view_reduce.map(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.total_rows, doc_count);
                    }
                    done();
                });
                test.strictEqual(view_reduce, ret);
            },
            "Reduce": function (done) {
                var ret = view_reduce.reduce(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.rows[0].value, doc_count);
                    }
                    done();
                });
                test.strictEqual(view_reduce, ret);
            }
        },
        "List Function": function (done) {
            var ret = view_map.list("test", function (err, result) {
                test.ifError(err);
                if (result) {
                    test.equal(result, "test successful");
                }
                done();
            });
            test.strictEqual(view_map, ret);
        }
    }
};
