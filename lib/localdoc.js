/**
 * ### LocalDocument API
 *
 * A `LocalDocument` object represents a single local document
 * (a document that does not get replicated)
 *
 *     var ldoc = db.ldoc("my-ldoc-id")
 */
var doc       = require("./document"),
    prototype = Object.create(doc.prototype);

/**
 * Behaves similar to the Document property with the same name,
 * also keeping the id and url in sync.
 *
 * @property name
 */
Object.defineProperty(prototype, "name", {
    get: function () {
        return this.id.split("/")[1];
    },
    set: function (v) {
        var id = this.id.split("/");
        id[1] = v;
        this.id = id.join("/");
    }
});

/*!
 * Create a new localdocument object
 *
 * @param {Database} db
 * @param {String} name
 *
 * @return {LocalDocument}
 */
exports.create = function (db, name) {
    var ddoc = Object.create(prototype);
    ddoc._init(db, "_local/" + name);
    return ddoc;
};
