'use strict';

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _build = require('./app/build');

var _buildStep = require('./app/build-step');

var _buildSession = require('./app/build-session');

var _cfHpeApi = require('cf-hpe-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hpeTestResultMapping = {
  success: 'Passed',
  failure: 'Failed',
  terminated: 'Failed'
};

var reportBuildPipelineStepStatus = function reportBuildPipelineStepStatus(buildStepObservable, buildSession) {
  buildStepObservable.flatMap(function (step) {
    return _buildSession.BuildSession.reportBuildPipelineStepStatus(buildSession, step);
  }).subscribe();
};

var reportBuildPipelineTestResults = function reportBuildPipelineTestResults(buildStepObservable, buildSession) {
  buildStepObservable.filter(function (step) {
    return _ramda2.default.contains(step.stepId, ['unit-test-script', 'integration-test-script']);
  }).flatMap(function (step) {
    var testResult = _cfHpeApi.HpeApiTestResult.create(step.stepId, step.startTime, step.duration, hpeTestResultMapping[step.result], buildSession.build.serviceName, buildSession.build.serviceName, buildSession.build.serviceName);

    return _buildSession.BuildSession.reportBuildPipelineTestResults(buildSession, step, [testResult]);
  }).subscribe();
};

_build.Build.buildsFromFirebase().flatMap(function (build) {
  return _buildSession.BuildSession.createForBuild(build).map(function (buildSession) {
    var buildStepObservable = _buildStep.BuildStep.stepsFromBuild(build).share();
    reportBuildPipelineStepStatus(buildStepObservable, buildSession);
    reportBuildPipelineTestResults(buildStepObservable, buildSession);
    return null;
  });
}).subscribe();