var config = require("../config"),
	couchdb = require("../../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	db = server.db(config.name("db")),
	doc = db.doc(config.name("doc")),
	_ = require("underscore"),
	attachments = {
		string: doc.attachment(config.name("attachment")),
		buffer: doc.attachment(config.name("attachment")),
		stream: doc.attachment(config.name("attachment"))
	}
	fs = require("fs");

module.exports = {
	setUp: function (test) {
		server.debug(config.log_level);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.recreate(function (err, result) {
			test.ifError(err);
			if (result) {
				test.ok(result.ok);
			}

			doc.save(function (err, result) {
				test.ifError(err);
				if (result) {
					test.ok(result.ok);
				}
				test.done();
			});
		});
	},

	suite: {
		create: {
			string: function (test) {
				attachments.string
					.setBody("text", "this is my plaintext attachment")
					.save(function (err, result) {
						test.ifError(err);
						if (result) {
							test.ok(result.ok);
						}
						test.done();
					});
			},
			buffer: function (test) {
				var buffer = new Buffer("<!DOCTYPE html><html><body><h1>This is a test</h1></body></html>", "utf8");

				attachments.buffer
					.setBody("html", buffer)
					.save(function (err, result) {
						test.ifError(err);
						if (result) {
							test.ok(result.ok);
						}
						test.done();
					});
			},
			stream: function (test) {
				attachments.stream
					.setBody("image/png", fs.createReadStream(__dirname + "/../couchdb-logo.png"))
					.save(function (err, result) {
						test.ifError(err);
						if (result) {
							test.ok(result.ok);
						}
						test.done();
					});
			}
		},
		get: {
			full: function (test) {
				attachments.string.get(function (err, content) {
					test.ifError(err);
					if (content) {
						test.ok(content);
					}
					test.done();
				});
			},
			stream: function (test) {
				attachments.stream.get(true, function (err, content) {
					var testFile = fs.createWriteStream(__dirname + "/../test.png", { encoding: "binary" });

					test.ifError(err);
					if (content) {
						content.pipe(testFile);
						content.on("end", function () {
							test.done();
						});
					} else {
						test.done();
					}
				});
			}
		},
		remove: function (test) {
			test.done();
		}
	},

	tearDown: function (test) {
		/*
		db.drop(function (err, result) {
			test.ifError(err);
			if (result) {
				test.ok(result.ok);
			}
			test.done();
		});
		*/
		test.done();
	}
};
