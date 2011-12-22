var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_ldoc"),
    ldoc = db.ldoc("test_ldoc_1");

module.exports = {
    before: function (done) {
        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        db.create(function (err, response) {
            ldoc.save(done);
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
