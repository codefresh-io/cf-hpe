'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CommonPipelineReporter = undefined;

var _buildSession = require('../build-session');

var CommonPipelineReporter = exports.CommonPipelineReporter = {};

CommonPipelineReporter.create = function (buildStepObservable, buildSession) {
  return buildStepObservable.flatMap(function (step) {
    return _buildSession.BuildSession.reportBuildPipelineStepStatus(buildSession, step);
  });
};