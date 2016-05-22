'use strict';

require('./config.env');

var _build = require('./app/build');

var _buildStep = require('./app/build-step');

var _hpeBuildSession = require('./app/hpe-build-session');

var _cfHpeApi = require('cf-hpe-api');

_build.Build.builds().flatMap(function (build) {
  return _hpeBuildSession.HpeBuildSession.openSession(build).flatMap(function (buildSession) {
    return _buildStep.BuildStep.steps(build).flatMap(function (step) {
      return _hpeBuildSession.HpeBuildSession.reportStepStatus(buildSession, step);
    });
  });
}).subscribe();