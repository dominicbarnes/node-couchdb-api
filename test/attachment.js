var config = require("./assets/config"),
    couchdb = require("../index"),
    server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
    db = server.db(config.name("db")),
    doc = db.doc(config.name("doc")),
    test = require("assert"),
    _ = require("underscore"),
    attachments = {
        string: doc.attachment(config.name("attachment")),
        buffer: doc.attachment(config.name("attachment")),
        stream: doc.attachment(config.name("attachment"))
    },
    fs = require("fs");

module.exports = {
    before: function (done) {
        server.debug(config.log_level);
        if (!config.conn.party) {
            server.setUser(config.conn.name, config.conn.password);
        }
        db.create(function (err, result) {
            doc.save(done);
        });
    },

    after: function (done) {
        db.drop(done);
    },

    "Attachment": {
        "Create": {
            "Plaintext": function (done) {
                attachments.string
                    .setBody("text", "this is my plaintext attachment")
                    .save(function (err, result) {
                        test.ifError(err);
                        if (result) {
                            test.ok(result.ok);
                        }
                        done();
                    });
            },
            "Using Buffer": function (done) {
                var buffer = new Buffer("<!DOCTYPE html><html><body><h1>This is a test</h1></body></html>", "utf8");

                attachments.buffer
                    .setBody("html", buffer)
                    .save(function (err, result) {
                        test.ifError(err);
                        if (result) {
                            test.ok(result.ok);
                        }
                        done();
                    });
            },
            "Using Stream": function (done) {
                attachments.stream
                    .setBody("image/png", fs.createReadStream(__dirname + "/assets/couchdb-logo.png"))
                    .save(function (err, result) {
                        test.ifError(err);
                        if (result) {
                            test.ok(result.ok);
                        }
                        done();
                    });
            }
        },
        "Get": {
            "Complete": {
                "Plaintext": function (done) {
                    attachments.string.get(function (err, content) {
                        test.ifError(err);
                        if (content) {
                            test.equal("this is my plaintext attachment", content);
                        }
                        done();
                    });
                },
                "Binary": function (done) {
                    attachments.stream.get(function (err, content) {
                        test.ifError(err);
                        if (content) {
                            test.ok(content);
                        }
                        done();
                    });
                }
            },
            "Stream": function (done) {
                var source = __dirname + "/assets/couchdb-logo.png",
                    target = __dirname + "/assets/test.png",
                    stream = fs.createWriteStream(target);

                attachments.stream.get(true, function (err, content) {
                    test.ifError(err);
                    if (content) {
                        content.pipe(stream);
                        content.on("end", function () {
                            fs.stat(source, function (err, sourceStats) {
                                fs.stat(target, function (err, targetStats) {
                                    test.equal(sourceStats.size, targetStats.size);
                                    fs.unlink(target, test.done);
                                    done();
                                });
                            });
                        });
                    } else {
                        done();
                    }
                });
            }
        }
    }
};
