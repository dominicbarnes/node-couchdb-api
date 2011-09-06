var _ = require("underscore"),
	colorize = require('colorize'),
	levels = [ "debug", "info", "warn", "error", "none" ],
	options = {
		colors: {
			debug: "cyan",
			info:  "green",
			warn:  "yellow",
			error: "red",
			def:   "white"
		},
		intro_width: 7
	};

function output(level, msg) {
	if (_.indexOf(levels, level) < this.levelIndex) {
		return false;
	}

	var args = _.toArray(arguments),
		method = args.shift().toLowerCase(),
		color = options.colors[method] || options.colors.def,
		padding = "";

	level = "[" + this.colorize(color, method) + "]";

	while (method.length + 2 + padding.length < options.intro_width) {
		padding += " ";
	}

	args.unshift(level + padding);

	(console[method] || console.log).apply(null, _.flatten(args));
}

function Log(level) {
	this.level(level);
}

function create(level) {
	return function () {
		var args = _.toArray(arguments);
		args.unshift(level);
		output.apply(this, args);
	};
}

Log.prototype.debug = create("debug");
Log.prototype.info  = create("info");
Log.prototype.warn  = create("warn");
Log.prototype.error = create("error");

Log.prototype.level = function (level) {
	level = level || "none";

	this.levelStr   = level;
	this.levelIndex = _.indexOf(levels, level);
};

Log.prototype.colorize = function (style, input) {
	return input ? colorize.ansify("#" + style + "[" + input + "]") : colorize.ansify(style);
};

module.exports = Log;
