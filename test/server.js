var expect = require("expect.js");
var couchdb = require("./mock");
var mockFile = couchdb.file("server");
var Server = require("../lib/server");
var Database = require("../lib/database");
var Document = require("../lib/document");


describe("Server API", function () {
    describe("Server(url)", function () {
        it("should be a function", function () {
            expect(Server).to.be.a("function");
        });

        it("should not require the new keyword", function () {
            var srv = Server("http://localhost:5984/");
            expect(srv).to.be.ok();
        });
    });

    describe("Server#url([path])", function () {
        it("should return a correct url", function () {
            var srv = new Server();
            expect(srv.url()).to.equal("http://localhost:5984/");
        });

        it("should include additional path information", function () {
            var srv = new Server();
            expect(srv.url("db")).to.equal("http://localhost:5984/db");
        });
    });

    describe("Server#info(callback)", function () {
        var srv = new Server();

        it("should return proper couchdb information", function (done) {
            couchdb
                .get("/")
                .replyWithFile(200, mockFile("info.json"));

            srv.info(function (err, info) {
                if (err) return done(err);

                expect(info.couchdb).to.equal("Welcome");
                expect(info.version).to.equal("1.3.1");
                expect(info.vendor.name).to.equal("The Apache Software Foundation");
                done();
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/")
                .replyWithFile(200, mockFile("info.json"));

            srv.info(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#activeTasks(callback)", function () {
        var srv = new Server();

        it("should return a list of active tasks", function (done) {
            couchdb
                .get("/_active_tasks")
                .replyWithFile(200, mockFile("active-tasks.json"));

            srv.activeTasks(function (err, tasks) {
                if (err) return done(err);
                expect(tasks).to.have.length(4);
                done();
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/_active_tasks")
                .replyWithFile(200, mockFile("active-tasks.json"));

            srv.activeTasks(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#allDbs(callback)", function () {
        var srv = new Server();

        it("should return a list of databases", function (done) {
            couchdb
                .get("/_all_dbs")
                .replyWithFile(200, mockFile("all-dbs.json"));

            srv.allDbs(function (err, list) {
                if (err) return done(err);
                expect(list).to.have.length(5);
                expect(list[0]).to.equal("_users");
                done();
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/_all_dbs")
                .replyWithFile(200, mockFile("all-dbs.json"));

            srv.allDbs(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#log([query], callback)", function () {
        var srv = new Server();

        it("should return a text log", function (done) {
            couchdb
                .get("/_log")
                .replyWithFile(200, mockFile("log.txt"), {
                    "Content-Type": "text/plain"
                });

            srv.log(function (err, log) {
                if (err) return done(err);
                expect(log).to.be.a("string");
                done();
            });
        });

        it("should include querystring parameters", function (done) {
            couchdb
                .get("/_log?bytes=500&offset=2000")
                .reply(200, "log data", {
                    "Content-Type": "text/plain"
                });

            srv.log({ bytes: 500, offset: 2000 }, done);
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/_log")
                .replyWithFile(200, mockFile("log.txt"), {
                    "Content-Type": "text/plain"
                });

            srv.log(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#register(name, info, callback)", function () {
        var srv = new Server();

        it("should create a document in the _users database", function (done) {
            couchdb
                .put("/_users/org.couchdb.user:jan", {
                    _id: "org.couchdb.user:jan",
                    name: "jan",
                    password: "apple",
                    type: "user"
                })
                .replyWithFile(201, mockFile("register.json"));

            srv.register("jan", { password: "apple" }, done);
        });

        it("should handle errors correctly", function (done) {
            couchdb
                .put("/_users/org.couchdb.user:jan", {
                    _id: "org.couchdb.user:jan",
                    name: "jan",
                    password: "apple",
                    type: "user"
                })
                .reply(403, {
                    error: "conflict",
                    reason: "Document update conflict"
                });

            srv.register("jan", { password: "apple" }, function (err) {
                expect(err).to.be.an(Error);
                done();
            });
        });

        it("should pass the created user document to the callback", function (done) {
            couchdb
                .put("/_users/org.couchdb.user:jan", {
                    _id: "org.couchdb.user:jan",
                    name: "jan",
                    password: "apple",
                    type: "user"
                })
                .replyWithFile(201, mockFile("register.json"));

            srv.register("jan", { password: "apple" }, function (err, userDoc) {
                if (err) return done(err);
                expect(userDoc).to.be.a(Document);
                done();
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .put("/_users/org.couchdb.user:jan", {
                    _id: "org.couchdb.user:jan",
                    name: "jan",
                    password: "apple",
                    type: "user"
                })
                .replyWithFile(201, mockFile("register.json"));

            srv.register("jan", { password: "apple" }, function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#restart(callback)", function () {
        var srv = new Server();

        it("should submit a server restart request", function (done) {
            couchdb
                .post("/_restart")
                .reply(202, {
                    "Content-Type": "text/plain"
                });

            srv.restart(done);
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .post("/_restart")
                .reply(202, {
                    "Content-Type": "text/plain"
                });

            srv.restart(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#stats([type], callback)", function () {
        var srv = new Server();

        it("should retrieve a full list of server stats", function (done) {
            couchdb
                .get("/_stats")
                .replyWithFile(200, mockFile("stats.json"));

            srv.stats(function (err, stats) {
                if (err) return done(err);
                expect(stats.couchdb.open_databases.description).to.equal("number of open databases");
                done();
            });
        });

        it("should filter the list down by type", function (done) {
            couchdb
                .get("/_stats/couchdb/request_time")
                .replyWithFile(200, mockFile("stats-filtered.json"));

            srv.stats("couchdb/request_time", function (err, stats) {
                if (err) return done(err);
                expect(stats.couchdb.request_time.description).to.equal("length of a request inside CouchDB without MochiWeb");
                done();
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/_stats")
                .replyWithFile(200, mockFile("stats.json"));

            srv.stats(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#uuids([count], callback)", function () {
        var srv = new Server();

        it("should retrieve a list of UUIDs", function (done) {
            couchdb
                .get("/_uuids")
                .replyWithFile(200, mockFile("uuids.json"));

            srv.uuids(function (err, uuids) {
                if (err) return done(err);
                expect(uuids).to.have.length(1);
                expect(uuids[0]).to.equal("75480ca477454894678e22eec6002413");
                done();
            });
        });

        it("should retrieve an arbitrary number of UUIDs", function (done) {
            couchdb
                .get("/_uuids?count=10")
                .replyWithFile(200, mockFile("uuids-10.json"));

            srv.uuids(10, function (err, uuids) {
                if (err) return done(err);
                expect(uuids).to.have.length(10);
                expect(uuids[9]).to.equal("75480ca477454894678e22eec6006161");
                done();
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/_uuids")
                .replyWithFile(200, mockFile("uuids.json"));

            srv.uuids(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#login(name, password, callback)", function () {
        var srv = new Server();

        it("should post username and password", function (done) {
            couchdb
                .post("/_session", {
                    name: "root",
                    password: "relax"
                })
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            srv.login("root", "relax", done);
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .post("/_session", {
                    name: "root",
                    password: "relax"
                })
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            srv.login("root", "relax", function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#session(callback)", function () {
        var srv = new Server();

        before(function (done) {
            couchdb
                .post("/_session", {
                    name: "root",
                    password: "relax"
                })
                .reply(200, "", {
                    "Content-Type": "text/plain",
                    "Set-Cookie": "AuthSession=cm9vdDo1MEJCRkYwMjq0LO0ylOIwShrgt8y-UkhI-c6BGw; Version=1; Path=/; HttpOnly"
                });

            srv.login("root", "relax", done);
        });

        it("should send the auth cookie", function (done) {
            couchdb
                .get("/_session")
                .matchHeader("cookie", "AuthSession=cm9vdDo1MEJCRkYwMjq0LO0ylOIwShrgt8y-UkhI-c6BGw")
                .reply(200, "", {
                    "Content-Type": "text/plain"
                });

            srv.session(done);
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .get("/_session")
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            srv.session(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#logout(callback)", function () {
        var srv = new Server();

        beforeEach(function (done) {
            couchdb
                .post("/_session", {
                    name: "root",
                    password: "relax"
                })
                .reply(200, "", {
                    "Content-Type": "text/plain",
                    "Set-Cookie": "AuthSession=cm9vdDo1MEJCRkYwMjq0LO0ylOIwShrgt8y-UkhI-c6BGw; Version=1; Path=/; HttpOnly"
                });

            srv.login("root", "relax", function () {
                process.nextTick(done);
            });
        });

        it("should send the auth cookie", function (done) {
            couchdb
                .delete("/_session")
                .matchHeader("cookie", "AuthSession=cm9vdDo1MEJCRkYwMjq0LO0ylOIwShrgt8y-UkhI-c6BGw")
                .reply(200, { ok: true });

            srv.logout(done);
        });

        it("should remove the cookie", function (done) {
            couchdb
                .delete("/_session")
                .matchHeader("cookie", "AuthSession=cm9vdDo1MEJCRkYwMjq0LO0ylOIwShrgt8y-UkhI-c6BGw")
                .reply(200, { ok: true }, {
                    "Set-Cookie": "AuthSession=; Version=1; Path=/; HttpOnly"
                });

            couchdb
                .get("/_session")
                .matchHeader("cookie", "AuthSession=")
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            srv.logout(function (err) {
                if (err) return done(err);

                process.nextTick(function () {
                    srv.session(done);
                });
            });
        });

        it("should preserve the server as the context of the callback", function (done) {
            couchdb
                .delete("/_session")
                .matchHeader("cookie", "AuthSession=cm9vdDo1MEJCRkYwMjq0LO0ylOIwShrgt8y-UkhI-c6BGw")
                .reply(200, {
                    "Content-Type": "text/plain"
                });

            srv.logout(function (err) {
                if (err) return done(err);
                expect(this).to.equal(srv);
                done();
            });
        });
    });

    describe("Server#config([section], [key], [value], callback)", function () {
        var srv = new Server();

        it("should return the entire configuration object", function (done) {
            couchdb
                .get("/_config")
                .replyWithFile(200, mockFile("config.json"));

            srv.config(function (err, config) {
                if (err) return done(err);
                expect(config).to.be.a("object");
                expect(Object.keys(config)).to.eql([
                    "attachments", "couch_httpd_auth", "couchdb", "daemons", "httpd", "httpd_db_handlers",
                    "httpd_design_handlers", "httpd_global_handlers", "log", "query_server_config", "query_servers",
                    "replicator", "stats", "uuids"
                ]);
                done();
            });
        });

        it("should return a single configuration section", function (done) {
            couchdb
                .get("/_config/httpd")
                .replyWithFile(200, mockFile("config-httpd.json"));

            srv.config("httpd", function (err, config) {
                if (err) return done(err);
                expect(config).to.be.a("object");
                expect(Object.keys(config)).to.eql([
                    "allow_jsonp", "authentication_handlers", "bind_address", "default_handler", "enable_cors",
                    "log_max_chunk_size", "port", "secure_rewrites", "vhost_global_handlers"
                ]);
                done();
            });
        });

        it("should return a single configuration key", function (done) {
            couchdb
                .get("/_config/log/level")
                .reply(200, JSON.stringify("debug"));

            srv.config("log", "level", function (err, config) {
                if (err) return done(err);
                expect(config).to.equal("debug");
                done();
            });
        });

        it("should update the specified configuration key", function (done) {
            couchdb
                .put("/_config/log/level", JSON.stringify("info"))
                .reply(200, JSON.stringify("debug"));

            srv.config("log", "level", "info", function (err, previous) {
                if (err) return done(err);
                expect(previous).to.equal("debug");
                done();
            });
        });

        it("should delete the specified configuration key", function (done) {
            couchdb
                .delete("/_config/log/level")
                .reply(200, JSON.stringify("info"));

            srv.config("log", "level", null, function (err, previous) {
                if (err) return done(err);
                expect(previous).to.equal("info");
                done();
            });
        });
    });

    describe("Server#db(name)", function () {
        var srv = new Server();

        it("should create a Database object", function () {
            expect(srv.db()).to.be.a(Database);
        });
    });
});
