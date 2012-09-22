"use strict";

var server = require("./lib/server");

exports.srv = function () {
    return server.apply(null, arguments);
};

exports.db = function (name) {
    return this.srv().db(name);
};
