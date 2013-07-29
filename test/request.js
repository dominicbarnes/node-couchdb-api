var _ = require("underscore"),
    test = require("assert"),
    config = require("./config"),
    couchdb = require("../"),
    server = couchdb.srv(config.url);

module.exports = {
    before: function (done) {
        if (!config.party) {
            server.auth = [ config.user, config.pass ];
        }
        done();
    },
    after: function (done) {
        done();
    },

    "Request": {
        "Test chaining": function (done) {
            test.strictEqual(server, server.setRequestOptions( { form: {} } ));
            done();
        },
        
        "Timeout occure": function(done) {
            server.setRequestOptions({timeout:1}).info(function(err, body){
                test.notEqual(err, null);
                test.ok( err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT' );
                test.equal(server._requestOpts, {});
                done();
            });
        },
        "Options are reset on the server object": function(done) {
            server.info(function(err, body){
                test.ifError(err);
                if (!err) {
                    test.equal(body.couchdb, "Welcome");
                }
                done();
            })
        }
    }
};
