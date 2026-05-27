.PHONY: build-TemporalFunction

build-TemporalFunction:
	cd src/temporal && npm install && npm run build
	cp src/temporal/index.js $(ARTIFACTS_DIR)/index.js
