'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpePipelineStepMapping = exports.HpeStatusMapping = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HpeStatusMapping = exports.HpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted'
};

HpeStatusMapping.isStatus = function (status) {
  return _ramda2.default.has(status, HpeStatusMapping);
};

var HpePipelineStepMapping = exports.HpePipelineStepMapping = {
  'Initializing Process': 'clone-repository',
  'Building Docker Image': 'build-dockerfile',
  'Running Unit Tests': 'unit-test-script',
  'Pushing to Docker Registry': 'push-docker-registry',
  'Running Integration Tests': 'integration-test-script',
  'security-validation': 'security-validation',
  'Running Deploy script': 'deploy-script'
};

HpePipelineStepMapping.isPipelineStep = function (name) {
  return _ramda2.default.has(name, HpePipelineStepMapping);
};