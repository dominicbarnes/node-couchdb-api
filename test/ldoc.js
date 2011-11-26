var config = require("./assets/config"),
	couchdb = require("../index"),
	server = couchdb.srv(config.conn.host, config.conn.port, config.conn.ssl),
	db = server.db(config.name("db")),
	ldoc = db.ldoc(config.name("ldoc")),
    test = require("assert"),
	_ = require("underscore");

module.exports = {
	before: function (done) {
		server.debug(config.log_level);
		if (!config.conn.party) {
			server.setUser(config.conn.name, config.conn.password);
		}
		db.create(function (err, response) {
			ldoc.save(done);
		});
	},

    after: function (done) {
		db.drop(done);
	},

	"Local Document": {
		"Get": function (done) {
			ldoc.get(function (err, response) {
				test.ifError(err);
				test.ok(response);
				done();
			});
		}
	}
};
