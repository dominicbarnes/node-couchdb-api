var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_1"),
    db2 = server.db("test_db_2"),
    db3 = server.db("test_db_3");

module.exports = {
    before: function (done) {
        [db, db2, db3].forEach(function (db) {
            db.server.debug = db.debug = config.debug;
        });
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        db.create(done);
    },

    after: function (done) {
        db.drop(function () {
            db2.drop(function () {
                db3.drop(done);
            });
        });
    },

    "Database": {
        "Information": function (done) {
            var ret = db.info(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.equal(db.name, response.db_name);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "Changes API": {
            "Static Query": function (done) {
                var ret = db.changes({}, function (err, response) {
                    test.ifError(err);
                    if (response) {
                        test.ok(response);
                    }
                    done();
                });
                test.strictEqual(db, ret);
            },
            "Stream": function (done) {
                function check(err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                    }
                }

                var ret = db.changes({ timeout: 250, feed: "continuous" }, function (err, stream) {
                    test.ifError(err);

                    if (stream) {
                        var changes = 0;
                        stream.on("change", function (change) {
                            changes++;
                        });

                        stream.on("end", function () {
                            test.equal(changes, 2);
                            done();
                        });

                        db.doc({ foo: "bar" }).save(check);
                        db.doc({ hello: "world" }).save(check);
                    }
                });

                test.strictEqual(db, ret);
            }
        },
        "Compaction": function (done) {
            var ret = db.compact(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(response.ok);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "View Cleanup": function (done) {
            var ret = db.viewCleanup(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(response.ok);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "Ensure Full Commit": function (done) {
            var ret = db.ensureFullCommit(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(response.ok);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "Replication": {
            "Using db objects": function (done) {
                var ret = db.replicate(db2, { create_target: true }, function (err, response) {
                    test.ifError(err);
                    test.ok(response.ok);

                    db2.info(function (err, response) {
                        test.ifError(err);
                        done();
                    });
                });
                test.strictEqual(db, ret);
            },
            "Using string name": function (done) {
                var ret = db.push(db3.name, { create_target: true }, function (err, response) {
                    test.ifError(err);
                    test.ok(response.ok);

                    db3.info(function (err, response) {
                        test.ifError(err);
                        done();
                    });
                });
                test.strictEqual(db, ret);
            },
            "Pull from another database": function (done) {
                var ret = db3.pull(db2, function (err, response) {
                    test.ifError(err);
                    test.ok(response.ok);
                    done();
                });
                test.strictEqual(db3, ret);
            }
        },
        "Security Object": function (done) {
            var ret = db.security(function (err, response) {
                test.ifError(err);
                test.ok(response);
                done();
            });
            test.strictEqual(db, ret);
        },
        "Temporary View": function (done) {
            var map = function (doc) {
                emit(null, doc);
            },
            ret = db.tempView(map, function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(response.rows);
                }
                done();
            });

            test.strictEqual(db, ret);
        },
        "Documents": {
            "Normal": function (done) {
                test.ok(db.doc);
                done();
            },
            "Design": function (done) {
                test.ok(db.ddoc);
                test.ok(db.designDoc);
                test.strictEqual(db.ddoc, db.designDoc);
                done();
            },
            "Local": function (done) {
                test.ok(db.ldoc);
                test.ok(db.localDoc);
                test.strictEqual(db.ldoc, db.localDoc);
                done();
            },
            "Bulk API": function (done) {
                var docs = [
                    { foo: "bar" },
                    { hello: "world" },
                    { bah: "humbug" }
                ],
                ret = db.bulkDocs(docs, function (err, response) {
                    test.ifError(err);
                    if (response) {
                        test.equal(response.length, docs.length);
                    }
                    done();
                });

                test.strictEqual(db, ret);
            }
        }
    }
};
