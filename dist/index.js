'use strict';

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _build = require('./app/build');

var _buildStep = require('./app/build-step');

var _buildSession = require('./app/build-session');

var _cfHpeApi = require('cf-hpe-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var aquaResults = require('./aqua.json');

var hpeTestResultMapping = {
  pass: 'Passed',
  fail: 'Failed'
};

var reportBuildPipelineSteps = function reportBuildPipelineSteps(buildStepObservable, buildSession) {
  return buildStepObservable.flatMap(function (step) {
    return _buildSession.BuildSession.reportBuildPipelineStepStatus(buildSession, step);
  });
};

var reportBuildPipelineTests = function reportBuildPipelineTests(buildStepObservable, buildSession) {
  return buildStepObservable.filter(function (step) {
    return _ramda2.default.contains(step.stepId, ['unit-test-script']);
  }).flatMap(function (step) {
    return _buildStep.BuildStep.childStepLogs(step).filter(_ramda2.default.test(/^\["(pass|fail)",{"title":.+}]\s+$/)).map(JSON.parse).map(function (testResult) {
      return _cfHpeApi.HpeApiTestResult.create(testResult[1].fullTitle, step.startTime, testResult[1].duration, hpeTestResultMapping[testResult[0]], testResult[1].err, testResult[1].err, testResult[1].stack);
    }).flatMap(function (hpeApiTestResult) {
      return _buildSession.BuildSession.reportBuildPipelineTestResults(buildSession, step, [hpeApiTestResult]);
    });
  });
};

var reportBuildPipelineSecurityTests = function reportBuildPipelineSecurityTests(buildStepObservable, buildSession) {
  return buildStepObservable.filter(function (step) {
    return _ramda2.default.contains(step.stepId, ['security-validation']);
  }).flatMap(function () {
    return aquaResults;
  }).map(JSON.parse).map(function (testResult) {
    return _cfHpeApi.HpeApiTestResult.create(testResult[1].fullTitle, step.startTime, testResult[1].duration, hpeTestResultMapping[testResult[0]], testResult[1].err, testResult[1].err, testResult[1].stack);
  }).flatMap(function (hpeApiTestResult) {
    return _buildSession.BuildSession.reportBuildPipelineTestResults(buildSession, step, [hpeApiTestResult]);
  });
};

_build.Build.buildsFromFirebase().flatMap(function (build) {
  return _buildSession.BuildSession.createForBuild(build).map(function (buildSession) {
    var buildStepObservable = _buildStep.BuildStep.stepsFromBuild(build).share();
    reportBuildPipelineSteps(buildStepObservable, buildSession).subscribe();
    reportBuildPipelineTests(buildStepObservable, buildSession).subscribe();
    reportBuildPipelineSecurityTests(buildStepObservable, buildSession).subscribe();
    return {};
  });
}).subscribe();