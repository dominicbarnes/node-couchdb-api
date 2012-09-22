clean:
	rm -f docs/data/*
	rm -f docs/output/*

docs: clean docs/data/server.json docs/data/database.json docs/data/document.json docs/data/attachment.json docs/data/designdoc.json docs/data/view.json docs/data/localdoc.json
	node docs/render.js

docs/data/%.json:
	dox < lib/`basename $@ .json`.js > $@
	node docs/transform.js $@
