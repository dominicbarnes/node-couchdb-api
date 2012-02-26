var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    testusername = "testuser",
    testpassword = "password";

module.exports = {
    before: function (done) {
        if (!config.party) {
            server.auth = config.user + ":" + config.pass;
        }
        done();
    },
    after: function (done) {
        server.db("_users").doc("org.couchdb.user:" + testusername).get(function (err, body, res) {
            this.del(function (err, body, res) {
                done();
            });
        });
    },

    "Server": {
        "Information": function (done) {
            test.strictEqual(server, server.info(function (err, body, res) {
                test.ifError(err);
                if (!err) {
                    test.equal(body.couchdb, "Welcome");
                }
                done();
            }));
        },
        "All Databases": function (done) {
            test.strictEqual(server, server.allDbs(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(Array.isArray(body));
                }
                done();
            }));
        },
        "Active Tasks": function (done) {
            test.strictEqual(server, server.activeTasks(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(Array.isArray(body));
                }
                done();
            }));
        },
        "Log": function (done) {
            test.strictEqual(server, server.log(function (err, body, res, headers) {
                test.ifError(err);
                if (body) {
                    test.ok(body);
                }
                done();
            }));
        },
        "Stats": function (done) {
            test.strictEqual(server, server.stats(function (err, body, res) {
                test.ifError(err);
                if (body) {
                    test.ok(body.couchdb);
                }
                done();
            }));
        },
        "UUIDs": function (done) {
            var finish = _.after(2, done);

            server.uuids(function (err, res, uuids) {
                test.ifError(err);
                if (uuids) {
                    test.equal(uuids.length, 1);
                }
                finish();
            })
            .uuids(10, function (err, res, uuids) {
                test.ifError(err);
                if (uuids) {
                    test.equal(uuids.length, 10);
                }
                finish();
            });
        },
        "User Document": {
            "No Options": function (done) {
                var user = server.userDoc(testusername, "bar");
                test.equal(user._id, "org.couchdb.user:" + testusername);
                test.equal(user.name, testusername);
                test.ok(user.salt);
                test.ok(user.password_sha);
                test.ok(user.roles);
                test.equal(user.type, "user");
                done();
            },
            "Options with Salt": function (done) {
                var user = server.userDoc(testusername, "bar", { salt: "my secret" });
                test.equal(user._id, "org.couchdb.user:" + testusername);
                test.equal(user.name, testusername);
                test.equal(user.salt, "my secret");
                test.ok(user.password_sha);
                test.ok(user.roles);
                test.equal(user.type, "user");
                done();
            },
            "Options with Roles": function (done) {
                var user = server.userDoc(testusername, "bar", { roles: ["user", "test"] });
                test.equal(user._id, "org.couchdb.user:" + testusername);
                test.equal(user.name, testusername);
                test.ok(user.salt);
                test.ok(user.password_sha);
                test.equal(user.roles.length, 2);
                test.equal(user.type, "user");
                done();
            }
        },
        "Auth": {
            "Register": function (done) {
                test.strictEqual(server, server.register(testusername, testpassword, function (err, body, res) {
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                    }
                    done();
                }));
            },
            "Login": function (done) {
                test.strictEqual(server, server.login(testusername, testpassword, function (err, body, res) {
                    //console.log(err, body);
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                        test.equal(body.name, testusername);
                    }
                    done();
                }));
            },
            "Check Session": function (done) {
                test.strictEqual(server, server.session(function (err, body, res) {
                    //console.log(err, body);
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                        test.equal(body.userCtx.name, testusername);
                    }
                    done();
                }));
            },
            "Logout": function (done) {
                test.strictEqual(server, server.logout(function (err, body, res) {
                    //console.log(err, body);
                    test.ifError(err);
                    if (body) {
                        test.ok(body.ok);
                    }
                    this.session(function (err, body, res) {
                        test.ifError(err);
                        if (body) {
                            test.ok(body.ok);
                            test.equal(body.userCtx.name, null);
                        }
                        done();
                    });
                }));
            }
        }
    }
};
