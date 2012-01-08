var view = require("./view");

/**
 * Create a new spatial object
 *
 * @param {object} ddoc
 * @param {string} name
 *
 * @return {object} spatial
 */
exports.create = function (ddoc, name) {
    var spatial = Object.create(view.proto);

    spatial.ddoc = ddoc;
    spatial.db = ddoc.db;
    spatial.server = ddoc.server;
    spatial.url = ddoc.url + "/_spatial/" + name;
    spatial.debug = ddoc.debug;

    return spatial;
};
