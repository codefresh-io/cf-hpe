'use strict';

var _build = require('./app/build');

var _buildStep = require('./app/build-step');

var _buildSession = require('./app/build-session');

var _commonPipelineReporter = require('./app/reporters/common-pipeline-reporter');

var _mochaJsonStreamReporter = require('./app/reporters/mocha-json-stream-reporter');

var _aquaSecurityReporter = require('./app/reporters/aqua-security-reporter');

_build.Build.buildsFromFirebase().flatMap(function (build) {
  return _buildSession.BuildSession.createForBuild(build).map(function (buildSession) {
    var buildStepObservable = _buildStep.BuildStep.stepsFromBuild(build).share();
    _commonPipelineReporter.CommonPipelineReporter.create(buildStepObservable, buildSession).subscribe();
    _mochaJsonStreamReporter.MochaJsonStreamReporter.create(buildStepObservable, buildSession).subscribe();
    _aquaSecurityReporter.AquaSecurityReporter.create(buildStepObservable, buildSession).subscribe();
    return {};
  });
}).subscribe();