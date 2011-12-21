/*!
 * CouchDB-API
 * @author Dominic Barnes <contact@dominicbarnes.us>
 */
var doc = require("./document");

var proto = Object.create(doc.proto, {
    name: {
        get: function () {
            return this.id.split("/")[1];
        },
        set: function (v) {
            var id = this.id.split("/");
            id[1] = v;
            this.id = id.join("/");
        }
    }
});

exports.create = function (db, name) {
    var ddoc = Object.create(proto);
    ddoc._init(db, "_local/" + name);
    return ddoc;
};
