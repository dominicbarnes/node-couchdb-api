var qs = require("querystring");

module.exports = {
	"application/json": {
		parse: JSON.parse,
		format: JSON.stringify
	},
	"application/x-www-form-urlencoded": {
		parse: qs.parse,
		format: qs.stringify
	},
	"text/plain": {
		parse: null,
		format: null
	},
	"text/html": {
		parse: null,
		format: null
	}
};
