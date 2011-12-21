var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_1"),
    doc = db.doc("test_doc_1"),
    fs = require("fs"),
    attachments = {
        string: doc.attachment("test_attachment_string"),
        buffer: doc.attachment("test_attachment_buffer"),
        stream: doc.attachment("test_attachment_stream")
    };

module.exports = {
    before: function (done) {
        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
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
