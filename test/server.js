var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    testusername = "testuser";

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
                    test.ok(Array.isArray(response));
                }
                done();
            });
            test.strictEqual(server, ret);
        },
        "Active Tasks": function (done) {
            var ret = server.activeTasks(function (err, response) {
                test.ifError(err);
                if (response) {
                    test.ok(Array.isArray(response));
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
