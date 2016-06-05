'use strict';

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _build = require('./app/build');

var _buildStep = require('./app/build-step');

var _buildSession = require('./app/build-session');

var _commonPipelineReporter = require('./app/reporters/common-pipeline-reporter');

var _mochaJsonStreamReporter = require('./app/reporters/mocha-json-stream-reporter');

var _aquaSecurityReporter = require('./app/reporters/aqua-security-reporter');

var _logger = require('./lib/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _logger.Logger.create('CfHpe');

logger.info('Start with configuration. ');

_build.Build.buildsFromFirebase().flatMap(function (build) {
  return _buildSession.BuildSession.createForBuild(build).map(function (buildSession) {
    var buildStepObservable = _buildStep.BuildStep.stepsFromBuild(build).share();
    _commonPipelineReporter.CommonPipelineReporter.create(buildStepObservable, buildSession).subscribe();
    _mochaJsonStreamReporter.MochaJsonStreamReporter.create(buildStepObservable, buildSession).subscribe();
    _aquaSecurityReporter.AquaSecurityReporter.create(buildStepObservable, buildSession).subscribe();
    return {};
  });
}).catch(function (error) {
  return _rx2.default.Observable.just({}).doOnNext(logger.error('Build error. error (%s)', error));
}).subscribe();