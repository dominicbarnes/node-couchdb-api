var qs = require("querystring");

exports.handlers = {
    "application/json": {
        parse: JSON.parse,
        format: JSON.stringify
    },
    "application/x-www-form-urlencoded": {
        parse: qs.parse,
        format: qs.stringify
    },
    "text/html": false,
    "text/plain": false
};

exports.handler = function (contentType, handlerType) {
    var handler = exports.handlers[contentType];
    if (!handler) {
        return false;
    }
    return handlerType ? handler[handlerType] : handler;
};

exports.accepts = Object.keys(exports.handlers).join(", ");
