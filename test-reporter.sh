#!/usr/bin/env bash
./node_modules/.bin/mocha \
  --compilers js:babel-register \
  --reporter cf-hpe-mocha-reporter \
  ./test/hpe-api.e2e.js

