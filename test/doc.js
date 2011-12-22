var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_doc"),
    doc_id = "test_doc_1",
    doc_api = db.doc(doc_id),
    doc_revs = [];

module.exports = {
    before: function (done) {
        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        db.create(function (err, response) {
            var ddoc = db.ddoc("test")
                .show("test", function (doc, req) {
                    return doc._id;
                })
                .save(done);
        });
    },

    after: function (done) {
        db.drop(done);
    },

    "Document": {
        "API": {
            "Save": function (done) {
                doc_api.body.hello = "world";
                doc_api.save(function (err, response) {
                    test.ifError(err);
                    if (response) {
                        doc_revs.push(response.rev);
                        test.ok(response.ok);
                    }
                    done();
                });
            },
            "Get/Read": function (done) {
                doc_api.get(function (err, doc) {
                    test.ifError(err);
                    if (doc) {
                        test.equal(doc.hello, "world");
                    }
                    done();
                });
            },
            "Show": function (done) {
                doc_api.show("test/test", function (err, response) {
                    test.ifError(err);
                    if (response) {
                        test.equal(response, doc_id);
                    }
                    done();
                });
            },
            "Prop": function (done) {
                var ret = doc_api.prop("foo", "bar");
                test.strictEqual(doc_api, ret);

                test.equal(doc_api.body.foo, "bar");
                test.equal(doc_api.body.foo, doc_api.prop("foo"));

                done();
            },
            "Delete": function (done) {
                doc_api.del(function (err, response) {
                    test.ifError(err);
                    if (response) {
                        doc_revs.push(response.rev);
                        test.ok(response.ok);
                    }
                    done();
                });
            }
            /* I keep getting "function_clause" errors trying to use _purge, CouchDB bug perhaps?
            "DB Purge": function (done) {
                var docs = {};
                docs[doc_id] = doc_revs;

                doc_api.db.purge(docs, function (err, response) {
                    test.ifError(err);
                    if (response) {
                        test.ok(response.ok);
                    }
                    done();
                });
            }
            */
        },
        "Init": {
            "No ID and no Body Defined": function (done) {
                var doc = db.doc();
                test.ifError(doc.id);
                test.ifError(doc.body._id);
                done();
            },
            "String ID Only": function (done) {
                var doc_id = "test_doc_1",
                    doc = db.doc(doc_id);

                test.equal(doc_id, doc.id);
                test.equal(doc_id, doc.body._id);
                done();
            },
            "Body with _id Defined": function (done) {
                var doc_id = "test_doc_2",
                    doc = db.doc({ _id: doc_id });

                test.equal(doc_id, doc.id);
                test.equal(doc_id, doc.body._id);
                done();
            },
            "Body with no _id": function (done) {
                var doc = db.doc({ foo: "bar" });

                test.ifError(doc.id);
                test.ifError(doc.body._id);
                test.equal(doc.body.foo, "bar");
                done();
            }
        }
        /*
        "Etag Cache Test": function (done) {
            var doc = db.doc({ cache: "test" });

            doc.save(function (err, result) {
                doc.get(function (err, result, response) {
                    // test to make sure this response ended up in the cache
                    test.equal(doc.cache[doc.url].etag, response.headers.etag);

                    doc.get(function (err, result, response) {
                        // test to make sure CouchDB returned the expected HTTP Status Code
                        test.equal(response.statusCode, 304);

                        // TODO: test for empty body of response object? (just to be sure)
                        done();
                    });
                });
            });
        }
        */
    }
};
