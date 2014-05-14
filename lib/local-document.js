// dependencies
var Document = require("./document");


// single export
module.exports = LocalDocument;

// inheritance
require("util").inherits(LocalDocument, Document);


/**
 * Represents a CouchDB local (non-replicating) document
 *
 * @constructor
 * @param {Server} server
 * @param {String} name
 */
function LocalDocument(db, name, rev) {
    if (!(this instanceof LocalDocument)) {
        return new LocalDocument(db, name, rev);
    }

    Document.apply(this, arguments);
}

/**
 * Prefixes "_design/" to id during set (get is unaffected)
 *
 * @param {String} [id]
 * @returns {String|DesignDocument}
 */
LocalDocument.prototype.id = function (id) {
    if (id) id = "_local/" + id;
    return Document.prototype.id.call(this, id);
};
