"use strict";

var fs    = require("fs"),
    path  = require("path"),
    glob  = require("glob"),
    async = require("async"),
    _     = require("underscore");

async.parallel({
    // gather the templates
    templates: function (done) {
        glob(path.join(__dirname, "*.ejs"), function (err, files) {
            if (err) {
                return done(err);
            }

            var templates = {};

            async.forEach(files, function (file, done) {
                fs.readFile(file, "utf8", function (err, data) {
                    if (err) {
                        return done(err);
                    } else {
                        templates[path.basename(file, ".ejs")] = _.template(data);
                        done();
                    }
                });
            }, function (err) {
                if (err) {
                    return done(err);
                }

                done(null, templates);
            });
        });
    },
    data: function (done) {
        glob(path.join(__dirname, "data", "*.json"), function (err, files) {
            if (err) {
                return done(err);
            }

            var data = {};

            files.forEach(function (file) {
                data[path.basename(file, ".json")] = require(file);
            });

            done(null, data);
        });
    }
}, function (err, results) {
    var templates = results.templates,
        output    = path.join(__dirname, "output/index.html"),
        data = {
            data: results.data,
            libs: [
                "server",
                "database",
                "document",
                "attachment",
                "view",
                "designdoc",
                "localdoc"
            ]
        },
        body = templates.layout({
            content:    templates.content(data),
            navigation: templates.navigation(data)
        });

    fs.writeFile(output, body, function (err) {
        if (err) {
            console.error(err);
        }

        console.log("Complete");
    });
});
