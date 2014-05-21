// dependencies
var Document = require("./document");


// single export
module.exports = LocalDocument;

// inheritance
require("util").inherits(LocalDocument, Document);


function LocalDocument(db, name, rev) {
    if (!(this instanceof LocalDocument)) {
        return new LocalDocument(db, name, rev);
    }

    Document.apply(this, arguments);
}

LocalDocument.prototype.id = function (id) {
    if (id) id = "_local/" + id;
    return Document.prototype.id.call(this, id);
};
