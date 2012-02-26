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
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        db.create(function (err, body, res) {
            test.ifError(err);
            done();
        });
    },

    after: function (done) {
        db.drop(function (err, body, res) {
            db2.drop(function (err, body, res) {
                db3.drop(function (err, body, res) {
                    done();
                });
            });
        });
    },

    "Database": {
        "Information": function (done) {
            test.strictEqual(db, db.info(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.equal(db.name, body.db_name);
                }
                done();
            }));
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
                ];

                test.strictEqual(db, db.bulkDocs(docs, function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.equal(body.length, docs.length);
                    }
                    done();
                }));
            }
        },
        "All Docs": {
            "No Options or Query": function (done) {
                test.strictEqual(db, db.allDocs(function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.equal(body.total_rows, 3);
                        test.equal(body.offset, 0);
                        test.equal(body.rows.length, 3);
                    }
                    done();
                }));
            },
            "Keys List": function (done) {
                test.strictEqual(db, db.allDocs(["hello_world"], function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.equal(body.total_rows, 3);
                        test.equal(body.offset, 0);
                        test.equal(body.rows.length, 1);
                        test.equal(body.rows[0].id, "hello_world");
                    }
                    done();
                }));
            },
            "Query": function (done) {
                test.strictEqual(db, db.allDocs({ include_docs: true, startkey: "f", endkey: "l" }, function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.equal(body.total_rows, 3);
                        test.equal(body.rows.length, 1);
                        test.ok(body.rows[0].doc);
                    }
                    done();
                }));
            },
            "Keys and Query": function (done) {
                var doc_id = "hello_world";

                test.strictEqual(db, db.allDocs({ include_docs: true }, [ doc_id ], function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.equal(body.total_rows, 3);
                        test.equal(body.offset, 0);
                        test.equal(body.rows.length, 1);
                        test.equal(body.rows[0].id, doc_id);
                        test.ok(body.rows[0].doc);
                        test.equal(body.rows[0].doc._id, doc_id);
                    }
                    done();
                }));
            }
        },
        "Management": {
            "Drop": function (done) {
                test.strictEqual(db, db.drop(function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                    }
                    done();
                }));
            },
            "Create": function (done) {
                test.strictEqual(db, db.create(function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                    }
                    done();
                }));
            },
            "Recreate": function (done) {
                test.strictEqual(db, db.recreate(function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                    }
                    done();
                }));
            }
        },
        "Changes API": {
            "Static Query": function (done) {
                test.strictEqual(db, db.changes({}, function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.ok(body);
                    }
                    done();
                }));
            },
            "Stream": function (done) {
                function check(err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                    }
                }

                test.strictEqual(db, db.changes({ timeout: 250, feed: "continuous" }, function (err, stream) {
                    test.ifError(err);

                    if (stream) {
                        var changes = 0;

                        stream.on("change", function (change) {
                            test.ok(change);
                            changes++;
                        });

                        stream.on("end", function () {
                            test.equal(changes, 2);
                            done();
                        });

                        db.doc({ foo: "bar" }).save(check);
                        db.doc({ hello: "world" }).save(check);
                    }
                }));
            }
        },
        "Compaction": function (done) {
            test.strictEqual(db, db.compact(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(body.ok);
                }
                done();
            }));
        },
        "View Cleanup": function (done) {
            test.strictEqual(db, db.viewCleanup(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(body.ok);
                }
                done();
            }));
        },
        "Ensure Full Commit": function (done) {
            test.strictEqual(db, db.ensureFullCommit(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(body.ok);
                }
                done();
            }));
        },
        "Replication": {
            "Using db objects": function (done) {
                test.strictEqual(db, db.replicate(db2, { create_target: true }, function (err, body, res) {
                    test.ifError(err);
                    test.ok(body.ok);

                    db2.info(function (err, body, res) {
                        test.ifError(err);
                        done();
                    });
                }));
            },
            "Using string name": function (done) {
                test.strictEqual(db, db.push(db3.name, { create_target: true }, function (err, body, res) {
                    test.ifError(err);
                    test.ok(body.ok);

                    db3.info(function (err, body, res) {
                        test.ifError(err);
                        done();
                    });
                }));
            },
            "Pull from another database": function (done) {
                test.strictEqual(db3, db3.pull(db2, function (err, body, res) {
                    test.ifError(err);
                    test.ok(body.ok);
                    done();
                }));
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
                    };

                test.strictEqual(db, db.security(obj, function (err, body, res) {
                    test.ifError(err);
                    test.ok(body);
                    done();
                }));
            },
            "Get": function (done) {
                test.strictEqual(db, db.security(function (err, body, res) {
                    test.ifError(err);
                    test.ok(body.admins.names);
                    test.equal(body.admins.names.length, 1);
                    test.equal(body.admins.names[0], "testuser");
                    test.equal(body.admins.roles.length, 1);
                    test.equal(body.admins.roles[0], "testrole");
                    done();
                }));
            }
        },
        "Temporary View": function (done) {
            var map = function (doc) {
                emit(null, doc);
            };

            test.strictEqual(db, db.tempView(map, function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(body.rows);
                }
                done();
            }));
        }
    }
};
