var qs = require("querystring"),
    none = {
        parse: null,
        format: null
    };

module.exports = {
    "application/json": {
        parse: JSON.parse,
        format: JSON.stringify
    },
    "application/x-www-form-urlencoded": {
        parse: qs.parse,
        format: qs.stringify
    },
    "text/plain":      none,
    "text/html":       none,
    "application/xml": none
};
