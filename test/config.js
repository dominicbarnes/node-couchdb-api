var counter = {};

module.exports = {
	// NOTE: assumes "Admin Party"
	conn: {
		host:     "localhost",
		port:     5984,
		party:    true,
		name:     null,
		password: null,
		ssl:      false
	},
	name: function (type) {
		counter[type] = counter[type] || 0;
		return "test_" + type + "_" + counter[type]++;
	}
};
