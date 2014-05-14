var CouchError = require("./coucherror");

exports.callback = function (fn, prop) {
    return function (err, res) {
        if (err) {
            fn(err, null, res);
        } else if (exports.hasCouchError(res)) {
            fn(new CouchError(res.body), null, res);
        } else if (prop && res.body) {
            fn(null, res.body[prop], res);
        } else {
            fn(null, res[res.type === "text/plain" ? "text" : "body"], res);
        }
    };
};

exports.hasCouchError = function (res) {
    return !!(res.error && res.body && res.body.error && res.body.reason);
};
