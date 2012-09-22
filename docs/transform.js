"use strict";

var fs     = require("fs"),
    path   = require("path"),
    file   = __dirname + "/../" + process.argv[2],
    api    = path.basename(file, ".json"),
    data   = require(file),
    intro  = data.shift(),
    output = {};

data = data.filter(function (comment) {
    return !comment.ignore;
});

output.api = api;

output.intro = {
    code:        intro.code,
    description: intro.description
};

output.methods = data
    .filter(function (comment) {
        return comment.ctx && comment.ctx.type === "method";
    })
    .map(function (comment) {
        var ret = {
            code:        comment.code,
            description: comment.description,
            ctx: {
                type:     "method",
                receiver: api,
                name:     comment.ctx.name,
                string:   api + "." + comment.ctx.name + "()"
            }
        };

        ret.http = comment.tags
            .filter(function (tag) {
                return tag.type === "http";
            })
            .map(function (tag) {
                return tag.string;
            });

        ret.args = comment.tags
            .filter(function (tag) {
                return tag.type === "param";
            })
            .map(function (tag) {
                return {
                    name:        tag.name,
                    dataTypes:   tag.types,
                    description: tag.description
                };
            });

        ret.returns = comment.tags
            .filter(function (tag) {
                return tag.type === "return";
            })
            .map(function (tag) {
                return {
                    dataTypes:   tag.types,
                    description: tag.description
                };
            })[0];

        if (ret.returns && ret.returns.description === "chainable") {
            ret.chainable = true;
        }

        return ret;
    });

output.properties = data
    .filter(function (comment) {
        var tags = comment.tags;
        return tags.length && tags[0].type === "property";
    })
    .map(function (comment) {
        var info = comment.tags.shift(),
            name = info.string;

        return {
            code:        comment.code,
            tags:        comment.tags,
            description: comment.description,
            ctx: {
                type:     "property",
                receiver: api,
                name:     name,
                string:   api + "." + name
            }
        };
    });

fs.writeFile(file, JSON.stringify(output, null, 4), function (err) {
    if (err) {
        throw err;
    }

    console.log("Complete");
});
