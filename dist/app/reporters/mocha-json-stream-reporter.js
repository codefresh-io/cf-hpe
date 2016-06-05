'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MochaJsonStreamReporter = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _buildStep = require('../build-step');

var _buildSession = require('../build-session');

var _cfHpeApi = require('cf-hpe-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hpeTestResultMapping = {
  pass: 'Passed',
  fail: 'Failed'
};

var MochaJsonStreamReporter = exports.MochaJsonStreamReporter = {};

MochaJsonStreamReporter.create = function (buildStepObservable, buildSession) {
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