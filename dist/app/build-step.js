'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BuildStep = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _firebaseRx = require('firebase-rx');

var _logger = require('../lib/logger');

var _hpeConfig = require('./hpe-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _logger.Logger.getLogger('BuildStep');

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

var BuildStep = exports.BuildStep = function () {
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
      logger.info('Processing build log steps. build (%s) service (%s)', build.id, build.name);
      var buildRunningStep = BuildStep._runningStep(build);
      var finishedStep = BuildStep._finishedStep(build);
      var childSteps = BuildStep._childSteps(build).takeUntil(finishedStep);

      return _rx2.default.Observable.concat(buildRunningStep, childSteps, finishedStep).timeout(_hpeConfig.HpeConfig.buildTimeout * 1000).catch(function (error) {
        logger.error('Build failed. build (%s) service (%s) error (%s)', build.id, build.name, error);

        return _rx2.default.Observable.just(new BuildStep('pipeline', build.startTime, _lodash2.default.now() - build.startTime, 'finished', 'failure'));
      }).doOnNext(function (buildStep) {
        logger.info('Build step. build (%s) service (%s) step (%s) status (%s) result (%s)', build.id, build.name, buildStep.stepId, buildStep.status, buildStep.result);
      }).doOnCompleted(function () {
        logger.info('Build finished. build (%s) service (%s)', build.id, build.name);
      });
    }
  }, {
    key: '_runningStep',
    value: function _runningStep(build) {
      return _firebaseRx.FirebaseRx.onValue(build.ref.child('data/started')).filter(function (snapshot) {
        return snapshot.exists();
      }).take(1).map(function () {
        return new BuildStep('pipeline', build.startTime, null, 'running', 'unavailable');
      });
    }
  }, {
    key: '_finishedStep',
    value: function _finishedStep(build) {
      return _firebaseRx.FirebaseRx.onValue(build.ref.child('data/finished')).filter(function (snapshot) {
        return snapshot.exists();
      }).take(1).flatMap(function () {
        return _firebaseRx.FirebaseRx.onValue(build.ref);
      }).filter(function (snapshot) {
        var buildLog = snapshot.val();
        return _lodash2.default.has(hpeStatusMapping, buildLog.status);
      }).take(1).map(function (snapshot) {
        var buildLog = snapshot.val();
        return new BuildStep('pipeline', build.startTime, _lodash2.default.now() - build.startTime, 'finished', hpeStatusMapping[buildLog.status]);
      });
    }
  }, {
    key: '_childSteps',
    value: function _childSteps(build) {
      return _firebaseRx.FirebaseRx.onChildChanged(build.ref.child('steps')).filter(function (snapshot) {
        var step = snapshot.val();
        return _lodash2.default.has(hpePipelineStepMapping, step.name) && _lodash2.default.has(hpeStatusMapping, step.status);
      }).map(function (snapshot) {
        var step = snapshot.val();
        return new BuildStep(hpePipelineStepMapping[step.name], step.creationTimeStamp * 1000, (step.finishTimeStamp - step.creationTimeStamp) * 1000, 'finished', hpeStatusMapping[step.status]);
      });
    }
  }]);

  return BuildStep;
}();
//# sourceMappingURL=data:application/json;base64,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QUFQO0FBTUQsT0FkSSxDQUFQO0FBZUQiLCJmaWxlIjoiYXBwL2J1aWxkLXN0ZXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFJ4IGZyb20gJ3J4JztcbmltcG9ydCB7IEZpcmViYXNlUnggfSBmcm9tICdmaXJlYmFzZS1yeCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICdsaWIvbG9nZ2VyJztcbmltcG9ydCB7IEhwZUNvbmZpZyB9IGZyb20gJ2FwcC9ocGUtY29uZmlnJztcblxuY29uc3QgbG9nZ2VyID0gTG9nZ2VyLmdldExvZ2dlcignQnVpbGRTdGVwJyk7XG5cbmNvbnN0IGhwZVN0YXR1c01hcHBpbmcgPSB7XG4gIHN1Y2Nlc3M6ICdzdWNjZXNzJyxcbiAgZXJyb3I6ICdmYWlsdXJlJyxcbiAgdGVybWluYXRlZDogJ2Fib3J0ZWQnLFxufTtcblxuY29uc3QgaHBlUGlwZWxpbmVTdGVwTWFwcGluZyA9IHtcbiAgJ0luaXRpYWxpemluZyBQcm9jZXNzJzogJ2Nsb25lLXJlcG9zaXRvcnknLFxuICAnQnVpbGRpbmcgRG9ja2VyIEltYWdlJzogJ2J1aWxkLWRvY2tlcmZpbGUnLFxuICAnUnVubmluZyBVbml0IFRlc3RzJzogJ3VuaXQtdGVzdC1zY3JpcHQnLFxuICAnUHVzaGluZyB0byBEb2NrZXIgUmVnaXN0cnknOiAncHVzaC1kb2NrZXItcmVnaXN0cnknLFxuICAnUnVubmluZyBJbnRlZ3JhdGlvbiBUZXN0cyc6ICdpbnRlZ3JhdGlvbi10ZXN0LXNjcmlwdCcsXG4gICdzZWN1cml0eS12YWxpZGF0aW9uJzogJ3NlY3VyaXR5LXZhbGlkYXRpb24nLFxuICAnUnVubmluZyBEZXBsb3kgc2NyaXB0JzogJ2RlcGxveS1zY3JpcHQnLFxufTtcblxuZXhwb3J0IGNsYXNzIEJ1aWxkU3RlcCB7XG4gIGNvbnN0cnVjdG9yKHN0ZXBJZCwgc3RhcnRUaW1lLCBkdXJhdGlvbiwgc3RhdHVzLCByZXN1bHQpIHtcbiAgICB0aGlzLnN0ZXBJZCA9IHN0ZXBJZDtcbiAgICB0aGlzLnN0YXJ0VGltZSA9IHN0YXJ0VGltZTtcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XG4gICAgdGhpcy5zdGF0dXMgPSBzdGF0dXM7XG4gICAgdGhpcy5yZXN1bHQgPSByZXN1bHQ7XG4gIH1cblxuICBzdGF0aWMgc3RlcHMoYnVpbGQpIHtcbiAgICBsb2dnZXIuaW5mbygnUHJvY2Vzc2luZyBidWlsZCBsb2cgc3RlcHMuIGJ1aWxkICglcykgc2VydmljZSAoJXMpJywgYnVpbGQuaWQsIGJ1aWxkLm5hbWUpO1xuICAgIGNvbnN0IGJ1aWxkUnVubmluZ1N0ZXAgPSBCdWlsZFN0ZXAuX3J1bm5pbmdTdGVwKGJ1aWxkKTtcbiAgICBjb25zdCBmaW5pc2hlZFN0ZXAgPSBCdWlsZFN0ZXAuX2ZpbmlzaGVkU3RlcChidWlsZCk7XG4gICAgY29uc3QgY2hpbGRTdGVwcyA9IEJ1aWxkU3RlcC5fY2hpbGRTdGVwcyhidWlsZCkudGFrZVVudGlsKGZpbmlzaGVkU3RlcCk7XG5cbiAgICByZXR1cm4gUnguT2JzZXJ2YWJsZVxuICAgICAgLmNvbmNhdChcbiAgICAgICAgYnVpbGRSdW5uaW5nU3RlcCxcbiAgICAgICAgY2hpbGRTdGVwcyxcbiAgICAgICAgZmluaXNoZWRTdGVwKVxuICAgICAgLnRpbWVvdXQoSHBlQ29uZmlnLmJ1aWxkVGltZW91dCAqIDEwMDApXG4gICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBsb2dnZXIuZXJyb3IoXG4gICAgICAgICAgJ0J1aWxkIGZhaWxlZC4gYnVpbGQgKCVzKSBzZXJ2aWNlICglcykgZXJyb3IgKCVzKScsXG4gICAgICAgICAgYnVpbGQuaWQsXG4gICAgICAgICAgYnVpbGQubmFtZSxcbiAgICAgICAgICBlcnJvcik7XG5cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuanVzdChcbiAgICAgICAgICBuZXcgQnVpbGRTdGVwKFxuICAgICAgICAgICAgJ3BpcGVsaW5lJyxcbiAgICAgICAgICAgIGJ1aWxkLnN0YXJ0VGltZSxcbiAgICAgICAgICAgIF8ubm93KCkgLSBidWlsZC5zdGFydFRpbWUsXG4gICAgICAgICAgICAnZmluaXNoZWQnLFxuICAgICAgICAgICAgJ2ZhaWx1cmUnKSk7XG4gICAgICB9KVxuICAgICAgLmRvT25OZXh0KGJ1aWxkU3RlcCA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKFxuICAgICAgICAgICdCdWlsZCBzdGVwLiBidWlsZCAoJXMpIHNlcnZpY2UgKCVzKSBzdGVwICglcykgc3RhdHVzICglcykgcmVzdWx0ICglcyknLFxuICAgICAgICAgIGJ1aWxkLmlkLFxuICAgICAgICAgIGJ1aWxkLm5hbWUsXG4gICAgICAgICAgYnVpbGRTdGVwLnN0ZXBJZCxcbiAgICAgICAgICBidWlsZFN0ZXAuc3RhdHVzLFxuICAgICAgICAgIGJ1aWxkU3RlcC5yZXN1bHQpO1xuICAgICAgfSlcbiAgICAgIC5kb09uQ29tcGxldGVkKCgpID0+IHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ0J1aWxkIGZpbmlzaGVkLiBidWlsZCAoJXMpIHNlcnZpY2UgKCVzKScsIGJ1aWxkLmlkLCBidWlsZC5uYW1lKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIF9ydW5uaW5nU3RlcChidWlsZCkge1xuICAgIHJldHVybiBGaXJlYmFzZVJ4Lm9uVmFsdWUoYnVpbGQucmVmLmNoaWxkKCdkYXRhL3N0YXJ0ZWQnKSlcbiAgICAgIC5maWx0ZXIoc25hcHNob3QgPT4gc25hcHNob3QuZXhpc3RzKCkpXG4gICAgICAudGFrZSgxKVxuICAgICAgLm1hcCgoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgQnVpbGRTdGVwKFxuICAgICAgICAgICdwaXBlbGluZScsXG4gICAgICAgICAgYnVpbGQuc3RhcnRUaW1lLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgJ3J1bm5pbmcnLFxuICAgICAgICAgICd1bmF2YWlsYWJsZScpO1xuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgX2ZpbmlzaGVkU3RlcChidWlsZCkge1xuICAgIHJldHVybiBGaXJlYmFzZVJ4Lm9uVmFsdWUoYnVpbGQucmVmLmNoaWxkKCdkYXRhL2ZpbmlzaGVkJykpXG4gICAgICAuZmlsdGVyKHNuYXBzaG90ID0+IHNuYXBzaG90LmV4aXN0cygpKVxuICAgICAgLnRha2UoMSlcbiAgICAgIC5mbGF0TWFwKCgpID0+IEZpcmViYXNlUngub25WYWx1ZShidWlsZC5yZWYpKVxuICAgICAgLmZpbHRlcihzbmFwc2hvdCA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkTG9nID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgIHJldHVybiBfLmhhcyhocGVTdGF0dXNNYXBwaW5nLCBidWlsZExvZy5zdGF0dXMpO1xuICAgICAgfSlcbiAgICAgIC50YWtlKDEpXG4gICAgICAubWFwKChzbmFwc2hvdCkgPT4ge1xuICAgICAgICBjb25zdCBidWlsZExvZyA9IHNuYXBzaG90LnZhbCgpO1xuICAgICAgICByZXR1cm4gbmV3IEJ1aWxkU3RlcChcbiAgICAgICAgICAncGlwZWxpbmUnLFxuICAgICAgICAgIGJ1aWxkLnN0YXJ0VGltZSxcbiAgICAgICAgICBfLm5vdygpIC0gYnVpbGQuc3RhcnRUaW1lLFxuICAgICAgICAgICdmaW5pc2hlZCcsXG4gICAgICAgICAgaHBlU3RhdHVzTWFwcGluZ1tidWlsZExvZy5zdGF0dXNdKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIF9jaGlsZFN0ZXBzKGJ1aWxkKSB7XG4gICAgcmV0dXJuIEZpcmViYXNlUngub25DaGlsZENoYW5nZWQoYnVpbGQucmVmLmNoaWxkKCdzdGVwcycpKVxuICAgICAgLmZpbHRlcihzbmFwc2hvdCA9PiB7XG4gICAgICAgIGNvbnN0IHN0ZXAgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgcmV0dXJuIF8uaGFzKGhwZVBpcGVsaW5lU3RlcE1hcHBpbmcsIHN0ZXAubmFtZSkgJiZcbiAgICAgICAgICBfLmhhcyhocGVTdGF0dXNNYXBwaW5nLCBzdGVwLnN0YXR1cyk7XG4gICAgICB9KVxuICAgICAgLm1hcChzbmFwc2hvdCA9PiB7XG4gICAgICAgIGNvbnN0IHN0ZXAgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBCdWlsZFN0ZXAoXG4gICAgICAgICAgaHBlUGlwZWxpbmVTdGVwTWFwcGluZ1tzdGVwLm5hbWVdLFxuICAgICAgICAgIHN0ZXAuY3JlYXRpb25UaW1lU3RhbXAgKiAxMDAwLFxuICAgICAgICAgIChzdGVwLmZpbmlzaFRpbWVTdGFtcCAtIHN0ZXAuY3JlYXRpb25UaW1lU3RhbXApICogMTAwMCxcbiAgICAgICAgICAnZmluaXNoZWQnLFxuICAgICAgICAgIGhwZVN0YXR1c01hcHBpbmdbc3RlcC5zdGF0dXNdKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
