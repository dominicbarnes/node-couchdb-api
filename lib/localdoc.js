var doc = require("./document");

// inherit the document prototype
var proto = Object.create(doc.proto);

// dependent directly on url
Object.defineProperty(proto, "name", {
    get: function () {
        return this.id.split("/")[1];
    },
    set: function (v) {
        var id = this.id.split("/");
        id[1] = v;
        this.id = id.join("/");
    }
});

/**
 * Create a new localdocument object
 *
 * @param {object} db
 * @param {string} name
 *
 * @return {object} ddoc
 */
exports.create = function (db, name) {
    var ddoc = Object.create(proto);
    ddoc._init(db, "_local/" + name);
    return ddoc;
};
