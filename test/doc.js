var config = require("./assets/config"),
    couchdb = require("../index"),
    server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
    db = server.db(config.name("db")),
    doc_id = config.name("doc"),
    doc_api = db.doc(doc_id),
    doc_revs = [],
    test = require("assert"),
    _ = require("underscore");

module.exports = {
    before: function (done) {
        server.debug(config.log_level);
        if (!config.conn.party) {
            server.setUser(config.conn.name, config.conn.password);
        }
        db.create(function (err, response) {
            var ddoc = db.ddoc("test");
            ddoc.show("test", function (doc, req) {
                return doc._id;
            });

            ddoc.save(done);
        });
    },

    after: function (done) {
        db.drop(done);
    },

    "Document": {
        "API Test": {
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
        "Init Test": {
            "No ID and no Body Defined": function (done) {
                var doc = db.doc();

                test.equal(doc.id,       null);
                test.equal(doc.body._id, null);
                done();
            },
            "String ID Only": function (done) {
                var doc_id = config.name("doc"),
                    doc = db.doc(doc_id);

                test.equal(doc_id, doc.id);
                test.equal(doc_id, doc.body._id);
                done();
            },
            "Body with _id Defined": function (done) {
                var doc_id = config.name("doc"),
                    doc = db.doc({ _id: doc_id });

                test.equal(doc_id, doc.id);
                test.equal(doc_id, doc.body._id);
                done();
            },
            "Body with no _id": function (done) {
                var doc = db.doc({ foo: "bar" });

                test.equal(doc.id,       null);
                test.equal(doc.body._id, null);
                test.equal(doc.body.foo, "bar");
                done();
            }
        },

        "GetURL Test": function (done) {
            var conn = config.conn,
                expectedUrl = "http";

            if (conn.ssl) {
                expectedUrl += "s";
            }
            expectedUrl += "://" + conn.host + ":" + conn.port + "/" + db.name + "/" + doc_api.id;

            test.equal(doc_api.url(), expectedUrl);
            done();
        },

        "Etag Cache Test": function (done) {
            var doc = db.doc({ cache: "test" });

            doc.save(function (err, result) {
                doc.get(function (err, result, response) {
                    // test to make sure this response ended up in the cache
                    test.equal(doc.client.cache[doc.url()].etag, response.headers.etag);

                    doc.get(function (err, result, response) {
                        // test to make sure CouchDB returned the expected HTTP Status Code
                        test.equal(response.statusCode, 304);

                        // TODO: test for empty body of response object? (just to be sure)

                        done();
                    });
                });
            });
        }
    }
};
