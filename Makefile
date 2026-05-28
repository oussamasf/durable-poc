.PHONY: build-TemporalFunction build-CallbackWorkerFunction

build-TemporalFunction:
	cd src/temporal && npm install && npm run build
	cp src/temporal/index.js $(ARTIFACTS_DIR)/index.js

build-CallbackWorkerFunction:
	cd src/callback-worker && npm install && npm run build
	cp src/callback-worker/index.js $(ARTIFACTS_DIR)/index.js
