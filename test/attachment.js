var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_attachment"),
    doc = db.doc("test_doc_1"),
    fs = require("fs"),
    attachments = {
        string:  doc.attachment("test_attachment_string"),
        buffer:  doc.attachment("test_attachment_buffer"),
        stream1: doc.attachment("test_attachment_stream_png"),
        stream2: doc.attachment("test_attachment_stream_json")
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
        db.drop(function (err, result) {
            if (err) {
                console.error(err);
            }
            done();
        });
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
            "Stream": {
                "PNG": function (done) {
                    attachments.stream1
                        .setBody("image/png", fs.createReadStream(__dirname + "/assets/couchdb-logo.png"))
                        .save(function (err, result) {
                            test.ifError(err);
                            if (result) {
                                test.ok(result.ok);
                            }
                            done();
                        });
                },
                "JSON": function (done) {
                    attachments.stream2
                        .setBody("application/json", fs.createReadStream(__dirname + "/../package.json"))
                        .save(function (err, result) {
                            test.ifError(err);
                            if (result) {
                                test.ok(result.ok);
                            }
                            done();
                        });
                }
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
                    attachments.stream1.get(function (err, content) {
                        test.ifError(err);
                        if (content) {
                            test.ok(content);
                        }
                        done();
                    });
                },
                "JSON": function (done) {
                    attachments.stream2.get(function (err, content) {
                        test.ifError(err);
                        if (content) {
                            test.ok(content);
                        }
                        done();
                    });
                }
            },
            "Stream PNG": function (done) {
                var source = __dirname + "/assets/couchdb-logo.png",
                    target = __dirname + "/assets/test.png",
                    stream = fs.createWriteStream(target);

                attachments.stream1.get(true, function (err, content) {
                    test.ifError(err);
                    if (content) {
                        content.pipe(stream);
                        content.on("end", function () {
                            fs.stat(source, function (err, sourceStats) {
                                test.ifError(err);
                                fs.stat(target, function (err, targetStats) {
                                    test.ifError(err);
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
