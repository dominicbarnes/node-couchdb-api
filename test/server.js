var config = require("./assets/config"),
    couchdb = require("../index"),
    server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
    testusername = "testuser",
    test = require("assert"),
    _ = require("underscore");

module.exports = {
    before: function (done) {
        server.debug(config.log_level);
        if (!config.conn.party) {
            server.setUser(config.conn.name, config.conn.password);
        }
        done();
    },
    after: function (done) {
        var user = server.db("_users").doc("org.couchdb.user:" + testusername);

        user.get(function (err, doc) {
            user.del(function (err, response) {
                done();
            });
        });
    },

    "Server": {
        "Information": function (done) {
            var ret = server.info(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.equal(response.couchdb, "Welcome");
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "All Databases": function (done) {
            var ret = server.allDbs(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(_.isArray(response));
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Active Tasks": function (done) {
            var ret = server.activeTasks(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(_.isArray(response));
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Log": function (done) {
            var ret = server.log(function (err, response, headers) {
                test.ifError(err);
                if (response) {
                    test.ok(response);
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Stats": function (done) {
            var ret = server.stats(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(response.couchdb);
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "UUIDs": function (done) {
            var finish = false;

            server
                .uuids(function (err, uuids) {
                    test.ifError(err);
                    if (uuids) {
                        test.equal(uuids.length, 1);
                    }

                    if (finish) {
                        done();
                    } else {
                        finish = true;
                    }
                })
                .uuids(10, function (err, uuids) {
                    test.ifError(err);
                    if (uuids) {
                        test.equal(uuids.length, 10);
                    }

                    if (finish) {
                        done();
                    } else {
                        finish = true;
                    }
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
        "Register": function (done) {
            var ret = server.register(testusername, "password", function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(response.ok);
                }
                done();
            });
            test.strictEqual(server, ret);
        }
    }
};
