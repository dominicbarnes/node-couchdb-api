var _ = require("underscore"),
    crypto = require("crypto");

/**
 * Takes a function, strips leading whitespace so that even functions
 * declared in an indented location can still appear like you expect
 *
 * NOTE: this is not a full parser/pretty-printer, it only removes the
 *       leading whitespace that is common to each line in the fn body
 *
 * @param {function|string} fn
 *
 * @return {string}
 */
exports.formatFunction = function (fn) {
    if (!fn) {
        return false;
    }
    var str = typeof fn === "string" ? fn : fn.toString(),
        lines = str.split(/[\r\n]+/g), // break up into lines
        body = lines.slice(1),         // leave off the declaration header, it's always left-aligned
        shortest = body.map(function (line) {
            // get all the leading spaces from each line
            return line.match(/^\s+/m)[0];
        }).sort(function (a, b) {
            // sort by the length of the whitespace
            return a.length - b.length;
        })[0]; // only return the first/shortest one

    return str.replace(new RegExp("^" + shortest, "m"), "");
};

/**
 * Helper function for generating a SHA1 hash of an input string
 *
 * @param {string} input
 *
 * @return {string}
 */
exports.sha1 = function (input) {
    input = (arguments.length > 1) ? _.toArray(arguments).join("") : input.toString();
    return crypto.createHash("sha1").update(input).digest("hex");
};
