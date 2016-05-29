'use strict';

require('./config.env');

var _build = require('./app/build');

var _buildStep = require('./app/build-step');

var _buildSession = require('./app/build-session');

var _cfHpeApi = require('cf-hpe-api');

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
    return step.stepId === 'unit-test-script';
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