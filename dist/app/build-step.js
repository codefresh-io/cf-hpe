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

function buildRunningObservable(build) {
  return build.ref.child('data/started').rx_onValue().filter(function (snapshot) {
    return snapshot.exists();
  }).take(1).map(function () {
    return new BuildStep('pipeline', build.startTime, null, 'running', 'unavailable');
  });
}

function buildStepsObservable(build) {
  return build.ref.child('steps').rx_onChildAdded().map(function (snapshot) {
    var step = snapshot.val();
    return new BuildStep('pipeline', build.startTime, null, 'running', 'unavailable');
  });
}

function buildFinishedObservable(build) {
  return build.ref.child('data/finished').rx_onValue().filter(function (snapshot) {
    return snapshot.exists();
  }).take(1).flatMap(function () {
    return build.ref.rx_onValue();
  }).filter(function (snapshot) {
    var buildLog = snapshot.val();
    return _lodash2.default.has(hpeStatusMapping, buildLog.status);
  }).take(1).map(function (snapshot) {
    var buildLog = snapshot.val();
    logger.info('Build finished. build (%s) status (%s)', build.id, buildLog.status);

    return new BuildStep('pipeline', build.startTime, _lodash2.default.now() - build.startTime, 'finished', hpeStatusMapping[buildLog.status]);
  });
}

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
      return _rx2.default.Observable.concat(buildRunningObservable(build),
      // buildStepsObservable(build),
      buildFinishedObservable(build)).timeout(_config2.default.buildTimeout * 1000).catch(function (error) {
        logger.error('Build failed. build (%s) error (%s)', build.id, error);
        return _rx2.default.Observable.just(new BuildStep('pipeline', build.startTime, _lodash2.default.now() - build.startTime, 'finished', 'failure'));
      });
    }
  }]);

  return BuildStep;
}();

exports.default = BuildStep;