'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

require('firebase-rx');

var _logger = require('../lib/logger');

var _logger2 = _interopRequireDefault(_logger);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _logger2.default.getLogger('build-step');

var hpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted'
};

var hpePipelineStepMapping = {
  'Initializing Process': 'clone-repository',
  'Building Docker Image': 'build-dockerfile',
  'Running Unit Tests': 'unit-test-script',
  'Pushing to Docker Registry': 'push-docker-registry',
  'Running Integration Tests': 'integration-test-script',
  'security-validation': 'security-validation',
  'Running Deploy script': 'deploy-script'
};

var BuildStep = function () {
  function BuildStep(stepId, startTime, duration, status, result) {
    _classCallCheck(this, BuildStep);

    this.stepId = stepId;
    this.startTime = startTime;
    this.duration = duration;
    this.status = status;
    this.result = result;
  }

  _createClass(BuildStep, null, [{
    key: 'steps',
    value: function steps(build) {
      var buildRunningStep = BuildStep.runningStep(build);
      var finishedStep = BuildStep.finishedStep(build);
      var childSteps = BuildStep.childSteps(build).takeUntil(finishedStep);

      return _rx2.default.Observable.concat(buildRunningStep, childSteps, finishedStep).timeout(_config2.default.buildTimeout * 1000).catch(function (error) {
        logger.error('Build failed. build (%s) error (%s)', build.id, error);
        return _rx2.default.Observable.just(new BuildStep('pipeline', build.startTime, _lodash2.default.now() - build.startTime, 'finished', 'failure'));
      }).doOnNext(function (buildStep) {
        logger.info('Build step. build (%s) step (%s) status (%s) result (%s)', build.id, buildStep.stepId, buildStep.status, buildStep.result);
      });
    }
  }, {
    key: 'runningStep',
    value: function runningStep(build) {
      return build.ref.child('data/started').rx_onValue().filter(function (snapshot) {
        return snapshot.exists();
      }).take(1).map(function () {
        return new BuildStep('pipeline', build.startTime, null, 'running', 'unavailable');
      });
    }
  }, {
    key: 'finishedStep',
    value: function finishedStep(build) {
      return build.ref.child('data/finished').rx_onValue().filter(function (snapshot) {
        return snapshot.exists();
      }).take(1).flatMap(function () {
        return build.ref.rx_onValue();
      }).filter(function (snapshot) {
        var buildLog = snapshot.val();
        return _lodash2.default.has(hpeStatusMapping, buildLog.status);
      }).take(1).map(function (snapshot) {
        var buildLog = snapshot.val();
        return new BuildStep('pipeline', build.startTime, _lodash2.default.now() - build.startTime, 'finished', hpeStatusMapping[buildLog.status]);
      });
    }
  }, {
    key: 'childSteps',
    value: function childSteps(build) {
      return build.ref.child('steps').rx_onChildAdded().filter(function (snapshot) {
        var step = snapshot.val();
        return _lodash2.default.has(hpePipelineStepMapping, step.name);
      }).map(function (snapshot) {
        var step = snapshot.val();
        return new BuildStep(hpePipelineStepMapping[step.name], step.creationTimeStamp * 1000, 1000, 'finished', 'success');
      });
    }
  }]);

  return BuildStep;
}();

exports.default = BuildStep;