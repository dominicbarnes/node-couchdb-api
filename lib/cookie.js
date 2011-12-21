/**
 * HTTP Cookie Toolkit
 * @requires underscore.js
 */

/** Module Dependencies */
var _ = require("underscore");

/**
 * Parses the HTTP Header into a Cookie object
 *
 * @param {string|string[]}  The HTTP header to parse
 * @return {object}
 */
exports.parse = function (cookieStr) {
    // If an array is passed, just use map to return an array of objects
    if (Array.isArray(cookieStr)) {
        return _.map(cookieStr, this.parse);
    }

    // split up the main components
    var parts = cookieStr.split(";"),
        main = parts.shift().split("="),
        ret = {
            name: main[0],
            value: main[1]
        };

    // look the portions we have and build our object
    _.each(parts, function (part, x) {
        part = part.split("=");

        // here we divide up the part into a key/value pair
        //   (sometimes we'll only have a key as a flag)
        var name = part[0] ? part[0].trim() : "",
            value = part[1] ? part[1].trim() : "";

        // add the key/value pair to our obj
        ret[name] = value;
    });

    return ret;
};

/**
 * Output an HTTP header based on a parsed Cookie object
 *
 * @param {object}  The parsed Cookie object
 * @return {string}  HTTP header text (set-cookie)
 */
exports.format = function (cookieObj) {
    var cookie = _.clone(cookieObj),              // create a clone, rather than working directly with the obj
        ret = [cookie.name + "=" + cookie.value]; // initialize the return array, with the cookie name/value as the first index

    // delete values we no longer need
    delete cookie.name;
    delete cookie.value;

    // add the flags and other configuration options
    _.each(cookie, function (value, key) {
        ret.push(value ? key + "=" + value : key);
    });

    return ret.join("; ");
};
