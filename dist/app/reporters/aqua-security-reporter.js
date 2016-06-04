'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AquaSecurityReporter = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _buildSession = require('../build-session');

var _cfHpeApi = require('cf-hpe-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var aquaResults = require('./aqua.json');
var hpeTestResultMapping = {
  medium: 'Passed',
  high: 'Failed'
};

var AquaSecurityReporter = exports.AquaSecurityReporter = {};

AquaSecurityReporter.create = function (buildStepObservable, buildSession) {
  return buildStepObservable.filter(function (step) {
    return _ramda2.default.contains(step.stepId, ['integration-test-script']);
  }).flatMap(function (step) {
    return _rx2.default.Observable.from(aquaResults.cves).map(function (cve) {
      return _cfHpeApi.HpeApiTestResult.create(cve.name, step.startTime, 1000, hpeTestResultMapping[cve.severity], cve.type, cve.description, cve.file);
    }).flatMap(function (hpeApiTestResult) {
      return _buildSession.BuildSession.reportBuildPipelineTestResults(buildSession, step, [hpeApiTestResult]);
    });
  });
};