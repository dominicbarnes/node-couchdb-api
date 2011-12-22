var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    testusername = "testuser",
    testpassword = "password";

module.exports = {
    before: function (done) {
        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        done();
    },
    after: function (done) {
        server.db("_users").doc("org.couchdb.user:" + testusername).get(function (err, body) {
            this.del(done);
        });
    },

    "Server": {
        "Information": function (done) {
            var ret = server.info(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.equal(result.couchdb, "Welcome");
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "All Databases": function (done) {
            var ret = server.allDbs(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(Array.isArray(result));
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Active Tasks": function (done) {
            var ret = server.activeTasks(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(Array.isArray(result));
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Log": function (done) {
            var ret = server.log(function (err, result, headers) {
                test.ifError(err);
                if (result) {
                    test.ok(result);
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Stats": function (done) {
            var ret = server.stats(function (err, result) {
                test.ifError(err);
                if (result) {
                    test.ok(result.couchdb);
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "UUIDs": function (done) {
            var finish = _.after(2, done);

            server.uuids(function (err, uuids) {
                test.ifError(err);
                if (uuids) {
                    test.equal(uuids.length, 1);
                }
                finish();
            })
            .uuids(10, function (err, uuids) {
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
                var ret = server.register(testusername, testpassword, function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                    }
                    done();
                });
                test.strictEqual(server, ret);
            },
            "Login": function (done) {
                var ret = server.login(testusername, testpassword, function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                        test.equal(result.name, testusername);
                    }
                    done();
                });
                test.strictEqual(server, ret);
            },
            "Check Session": function (done) {
                var ret = server.session(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                        test.equal(result.userCtx.name, testusername);
                    }
                    done();
                });
                test.strictEqual(server, ret);
            },
            "Logout": function (done) {
                var ret = server.logout(function (err, result) {
                    test.ifError(err);
                    if (result) {
                        test.ok(result.ok);
                    }
                    this.session(function (err, result) {
                        test.ifError(err);
                        if (result) {
                            test.ok(result.ok);
                            test.equal(result.userCtx.name, null);
                        }
                        done();
                    });
                });
                test.strictEqual(server, ret);
            }
        }
    }
};
