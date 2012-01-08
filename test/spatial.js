var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.host, config.port, config.ssl),
    db = server.db("test_db_view"),
    ddoc = db.ddoc("test_ddoc_1"),
    spatial_name = "test_spatial_1";

module.exports = {
    before: function (done) {
        server.debug = config.debug;
        if (!config.party) {
            server.setUser(config.user, config.pass);
        }
        done();
    },

    after: function (done) {
        done();
    },

    "Spatial": function (done) {
        test.ifError(ddoc._body.spatials);

        ddoc.spatial(spatial_name, function (doc) {
            emit(doc._id);
        });

        test.ok(ddoc._body.spatials);
        test.ok(ddoc._body.spatials[spatial_name]);
        test.ok(ddoc._body.spatials[spatial_name].map);
        test.ifError(ddoc._body.spatials[spatial_name].reduce);

        ddoc.spatial(spatial_name, function (doc) {
            emit(doc._id);
        }, function (values, key, rereduce) {
            return values.length;
        });

        test.ok(ddoc._body.spatials);
        test.ok(ddoc._body.spatials[spatial_name]);
        test.ok(ddoc._body.spatials[spatial_name].map);
        test.ok(ddoc._body.spatials[spatial_name].reduce);

        done();
    }
};
