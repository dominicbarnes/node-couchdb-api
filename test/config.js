var counter = {};

module.exports = {
	conn: {
		host:     "localhost",
		port:     5984,
		party:    true,
		name:     "admin",
		password: "M@tte0s"
	},
	name: function (type) {
		counter[type] = counter[type] || 0;
		return "test_" + type + "_" + counter[type]++;
	}
};
