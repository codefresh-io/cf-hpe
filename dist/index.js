'use strict';

require('./config.env');

var _app = require('./app');

_app.Build.builds().flatMap(function (build) {
  return _app.BuildSession.openBuildSession(build).flatMap(function (buildSession) {
    return _app.BuildStep.steps(build).flatMap(function (step) {
      return _app.BuildSession.reportBuildPipelineStepStatus(buildSession, step);
    });
  });
}).subscribe();