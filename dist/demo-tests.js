'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DemoTests = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _buildSession = require('./app/build-session');

var _cfHpeApi = require('cf-hpe-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const hpeTestResultMapping = {
//  success: 'Passed',
//  failure: 'Failed',
//  terminated: 'Failed',
// };

var DemoTests = exports.DemoTests = {};

DemoTests.testResults = [{
  name: 'Should fail when not passing any object',
  status: 'Passed'
}, {
  name: 'Should fail when not passing id',
  status: 'Failed',
  errorType: 'AssertionError',
  errorMessage: 'expected Error: add or update node failed failed because node.id param is missing to equal Errorr: add or update node failed failed because node.id param is missing',
  errorStackTrace: 'events.js:154\n   throw er; // Unhandled error event'
}];

DemoTests.reportBuildPipelineTestResults = function (buildStepObservable, buildSession) {
  buildStepObservable.filter(function (step) {
    return _ramda2.default.contains(step.stepId, ['unit-test-script']);
  }).flatMap(function (step) {
    return _rx2.default.Observable.from(DemoTests.testResults).map(function (testResult) {
      return _cfHpeApi.HpeApiTestResult.create(testResult.name, step.startTime, step.duration, testResult.status, buildSession.build.serviceName, buildSession.build.serviceName, buildSession.build.serviceName, testResult.errorType, testResult.errorMessage, testResult.errorStackTrace);
    }).flatMap(function (hpeApiTestResult) {
      return _buildSession.BuildSession.reportBuildPipelineTestResults(buildSession, step, [hpeApiTestResult]);
    });
  }).subscribe();
};