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
            var ret = db.info(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.equal(db.name, result.db_name);
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
                        { _id: "blah", foo: "bar" },
                        { _id: "hello_world", bah: "humbug" },
                        { hello: "world" }
                    ],
                    ret = db.bulkDocs(docs, function (err, result) {
                        test.ifError(err);
                        if (result) {
                            test.equal(result.length, docs.length);
                        }
                        done();
                    });

                test.strictEqual(db, ret);
            }
        },
        "All Docs": {
            "No Options or Query": function (done) {
                var ret = db.allDocs(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.total_rows, 3);
                        test.equal(result.offset, 0);
                        test.equal(result.rows.length, 3);
                    }
                    done();
                });
                test.strictEqual(db, ret);
            },
            "Keys List": function (done) {
                var ret = db.allDocs(["hello_world"], function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.total_rows, 3);
                        test.equal(result.offset, 0);
                        test.equal(result.rows.length, 1);
                        test.equal(result.rows[0].id, "hello_world");
                    }
                    done();
                });
                test.strictEqual(db, ret);
            },
            "Query": function (done) {
                var ret = db.allDocs({ include_docs: true, startkey: "f", endkey: "l" }, function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.equal(result.total_rows, 3);
                        test.equal(result.rows.length, 1);
                        test.ok(result.rows[0].doc);
                    }
                    done();
                });
                test.strictEqual(db, ret);
            },
            "Keys and Query": function (done) {
                var doc_id = "hello_world",
                    ret = db.allDocs({ include_docs: true }, [ doc_id ], function (err, result) {
                        test.ifError(err);
                        if (result) {
                            test.equal(result.total_rows, 3);
                            test.equal(result.offset, 0);
                            test.equal(result.rows.length, 1);
                            test.equal(result.rows[0].id, doc_id);
                            test.ok(result.rows[0].doc);
                            test.equal(result.rows[0].doc._id, doc_id);
                        }
                        done();
                    });
                test.strictEqual(db, ret);
            }
        },
        "Management": {
            "Drop": function (done) {
                var ret = db.drop(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                    }
                    done();
                });
                test.strictEqual(db, ret);
            },
            "Create": function (done) {
                var ret = db.create(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                    }
                    done();
                });
                test.strictEqual(db, ret);
            },
            "Recreate": function (done) {
                var ret = db.recreate(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                    }
                    done();
                });
                test.strictEqual(db, ret);
            }
        },
        "Changes API": {
            "Static Query": function (done) {
                var ret = db.changes({}, function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result);
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
            var ret = db.compact(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(result.ok);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "View Cleanup": function (done) {
            var ret = db.viewCleanup(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(result.ok);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "Ensure Full Commit": function (done) {
            var ret = db.ensureFullCommit(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(result.ok);
                }
                done();
            });
            test.strictEqual(db, ret);
        },
        "Replication": {
            "Using db objects": function (done) {
                var ret = db.replicate(db2, { create_target: true }, function (err, result) {
                    test.ifError(err);
                    test.ok(result.ok);

                    db2.info(function (err, result) {
                        test.ifError(err);
                        done();
                    });
                });
                test.strictEqual(db, ret);
            },
            "Using string name": function (done) {
                var ret = db.push(db3.name, { create_target: true }, function (err, result) {
                    test.ifError(err);
                    test.ok(result.ok);

                    db3.info(function (err, result) {
                        test.ifError(err);
                        done();
                    });
                });
                test.strictEqual(db, ret);
            },
            "Pull from another database": function (done) {
                var ret = db3.pull(db2, function (err, result) {
                    test.ifError(err);
                    test.ok(result.ok);
                    done();
                });
                test.strictEqual(db3, ret);
            }
        },
        "Security": {
            "Set": function (done) {
                var obj = {
                        admins: {
                            names: ["testuser"],
                            roles: ["testrole"]
                        },
                        readers: {
                            names: [],
                            roles: []
                        }
                    }, ret = db.security(obj, function (err, result) {
                        test.ifError(err);
                        test.ok(result);
                        done();
                    });
                test.strictEqual(db, ret);
            },
            "Get": function (done) {
                var ret = db.security(function (err, result) {
                    test.ifError(err);
                    test.ok(result.admins.names);
                    test.equal(result.admins.names.length, 1);
                    test.equal(result.admins.names[0], "testuser");
                    test.equal(result.admins.roles.length, 1);
                    test.equal(result.admins.roles[0], "testrole");
                    done();
                });
                test.strictEqual(db, ret);
            }
        },
        "Temporary View": function (done) {
            var map = function (doc) {
                emit(null, doc);
            },
            ret = db.tempView(map, function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(result.rows);
                }
                done();
            });

            test.strictEqual(db, ret);
        }
    }
};
