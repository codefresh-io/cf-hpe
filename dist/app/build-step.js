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

var logger = _logger.Logger.create('BuildStep');

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
      var buildRunningStep = BuildStep.runningStep(build);
      var finishedStep = BuildStep.finishedStep(build);
      var childSteps = BuildStep.childSteps(build).takeUntil(finishedStep);

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
    key: 'runningStep',
    value: function runningStep(build) {
      return _firebaseRx.FirebaseRx.onValue(build.ref.child('data/started')).filter(function (snapshot) {
        return snapshot.exists();
      }).take(1).map(function () {
        return new BuildStep('pipeline', build.startTime, null, 'running', 'unavailable');
      });
    }
  }, {
    key: 'finishedStep',
    value: function finishedStep(build) {
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
    key: 'childSteps',
    value: function childSteps(build) {
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
//# sourceMappingURL=data:application/json;base64,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UDtBQU1ELE9BZEksQ0FBUDtBQWVEIiwiZmlsZSI6ImFwcC9idWlsZC1zdGVwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBSeCBmcm9tICdyeCc7XG5pbXBvcnQgeyBGaXJlYmFzZVJ4IH0gZnJvbSAnZmlyZWJhc2UtcngnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnbGliL2xvZ2dlcic7XG5pbXBvcnQgeyBIcGVDb25maWcgfSBmcm9tICdhcHAvaHBlLWNvbmZpZyc7XG5cbmNvbnN0IGxvZ2dlciA9IExvZ2dlci5jcmVhdGUoJ0J1aWxkU3RlcCcpO1xuXG5jb25zdCBocGVTdGF0dXNNYXBwaW5nID0ge1xuICBzdWNjZXNzOiAnc3VjY2VzcycsXG4gIGVycm9yOiAnZmFpbHVyZScsXG4gIHRlcm1pbmF0ZWQ6ICdhYm9ydGVkJyxcbn07XG5cbmNvbnN0IGhwZVBpcGVsaW5lU3RlcE1hcHBpbmcgPSB7XG4gICdJbml0aWFsaXppbmcgUHJvY2Vzcyc6ICdjbG9uZS1yZXBvc2l0b3J5JyxcbiAgJ0J1aWxkaW5nIERvY2tlciBJbWFnZSc6ICdidWlsZC1kb2NrZXJmaWxlJyxcbiAgJ1J1bm5pbmcgVW5pdCBUZXN0cyc6ICd1bml0LXRlc3Qtc2NyaXB0JyxcbiAgJ1B1c2hpbmcgdG8gRG9ja2VyIFJlZ2lzdHJ5JzogJ3B1c2gtZG9ja2VyLXJlZ2lzdHJ5JyxcbiAgJ1J1bm5pbmcgSW50ZWdyYXRpb24gVGVzdHMnOiAnaW50ZWdyYXRpb24tdGVzdC1zY3JpcHQnLFxuICAnc2VjdXJpdHktdmFsaWRhdGlvbic6ICdzZWN1cml0eS12YWxpZGF0aW9uJyxcbiAgJ1J1bm5pbmcgRGVwbG95IHNjcmlwdCc6ICdkZXBsb3ktc2NyaXB0Jyxcbn07XG5cbmV4cG9ydCBjbGFzcyBCdWlsZFN0ZXAge1xuICBjb25zdHJ1Y3RvcihzdGVwSWQsIHN0YXJ0VGltZSwgZHVyYXRpb24sIHN0YXR1cywgcmVzdWx0KSB7XG4gICAgdGhpcy5zdGVwSWQgPSBzdGVwSWQ7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBzdGFydFRpbWU7XG4gICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuICAgIHRoaXMucmVzdWx0ID0gcmVzdWx0O1xuICB9XG5cbiAgc3RhdGljIHN0ZXBzKGJ1aWxkKSB7XG4gICAgbG9nZ2VyLmluZm8oJ1Byb2Nlc3NpbmcgYnVpbGQgbG9nIHN0ZXBzLiBidWlsZCAoJXMpIHNlcnZpY2UgKCVzKScsIGJ1aWxkLmlkLCBidWlsZC5uYW1lKTtcbiAgICBjb25zdCBidWlsZFJ1bm5pbmdTdGVwID0gQnVpbGRTdGVwLnJ1bm5pbmdTdGVwKGJ1aWxkKTtcbiAgICBjb25zdCBmaW5pc2hlZFN0ZXAgPSBCdWlsZFN0ZXAuZmluaXNoZWRTdGVwKGJ1aWxkKTtcbiAgICBjb25zdCBjaGlsZFN0ZXBzID0gQnVpbGRTdGVwLmNoaWxkU3RlcHMoYnVpbGQpLnRha2VVbnRpbChmaW5pc2hlZFN0ZXApO1xuXG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGVcbiAgICAgIC5jb25jYXQoXG4gICAgICAgIGJ1aWxkUnVubmluZ1N0ZXAsXG4gICAgICAgIGNoaWxkU3RlcHMsXG4gICAgICAgIGZpbmlzaGVkU3RlcClcbiAgICAgIC50aW1lb3V0KEhwZUNvbmZpZy5idWlsZFRpbWVvdXQgKiAxMDAwKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKFxuICAgICAgICAgICdCdWlsZCBmYWlsZWQuIGJ1aWxkICglcykgc2VydmljZSAoJXMpIGVycm9yICglcyknLFxuICAgICAgICAgIGJ1aWxkLmlkLFxuICAgICAgICAgIGJ1aWxkLm5hbWUsXG4gICAgICAgICAgZXJyb3IpO1xuXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3QoXG4gICAgICAgICAgbmV3IEJ1aWxkU3RlcChcbiAgICAgICAgICAgICdwaXBlbGluZScsXG4gICAgICAgICAgICBidWlsZC5zdGFydFRpbWUsXG4gICAgICAgICAgICBfLm5vdygpIC0gYnVpbGQuc3RhcnRUaW1lLFxuICAgICAgICAgICAgJ2ZpbmlzaGVkJyxcbiAgICAgICAgICAgICdmYWlsdXJlJykpO1xuICAgICAgfSlcbiAgICAgIC5kb09uTmV4dChidWlsZFN0ZXAgPT4ge1xuICAgICAgICBsb2dnZXIuaW5mbyhcbiAgICAgICAgICAnQnVpbGQgc3RlcC4gYnVpbGQgKCVzKSBzZXJ2aWNlICglcykgc3RlcCAoJXMpIHN0YXR1cyAoJXMpIHJlc3VsdCAoJXMpJyxcbiAgICAgICAgICBidWlsZC5pZCxcbiAgICAgICAgICBidWlsZC5uYW1lLFxuICAgICAgICAgIGJ1aWxkU3RlcC5zdGVwSWQsXG4gICAgICAgICAgYnVpbGRTdGVwLnN0YXR1cyxcbiAgICAgICAgICBidWlsZFN0ZXAucmVzdWx0KTtcbiAgICAgIH0pXG4gICAgICAuZG9PbkNvbXBsZXRlZCgoKSA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdCdWlsZCBmaW5pc2hlZC4gYnVpbGQgKCVzKSBzZXJ2aWNlICglcyknLCBidWlsZC5pZCwgYnVpbGQubmFtZSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBydW5uaW5nU3RlcChidWlsZCkge1xuICAgIHJldHVybiBGaXJlYmFzZVJ4Lm9uVmFsdWUoYnVpbGQucmVmLmNoaWxkKCdkYXRhL3N0YXJ0ZWQnKSlcbiAgICAgIC5maWx0ZXIoc25hcHNob3QgPT4gc25hcHNob3QuZXhpc3RzKCkpXG4gICAgICAudGFrZSgxKVxuICAgICAgLm1hcCgoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgQnVpbGRTdGVwKFxuICAgICAgICAgICdwaXBlbGluZScsXG4gICAgICAgICAgYnVpbGQuc3RhcnRUaW1lLFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgJ3J1bm5pbmcnLFxuICAgICAgICAgICd1bmF2YWlsYWJsZScpO1xuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZmluaXNoZWRTdGVwKGJ1aWxkKSB7XG4gICAgcmV0dXJuIEZpcmViYXNlUngub25WYWx1ZShidWlsZC5yZWYuY2hpbGQoJ2RhdGEvZmluaXNoZWQnKSlcbiAgICAgIC5maWx0ZXIoc25hcHNob3QgPT4gc25hcHNob3QuZXhpc3RzKCkpXG4gICAgICAudGFrZSgxKVxuICAgICAgLmZsYXRNYXAoKCkgPT4gRmlyZWJhc2VSeC5vblZhbHVlKGJ1aWxkLnJlZikpXG4gICAgICAuZmlsdGVyKHNuYXBzaG90ID0+IHtcbiAgICAgICAgY29uc3QgYnVpbGRMb2cgPSBzbmFwc2hvdC52YWwoKTtcbiAgICAgICAgcmV0dXJuIF8uaGFzKGhwZVN0YXR1c01hcHBpbmcsIGJ1aWxkTG9nLnN0YXR1cyk7XG4gICAgICB9KVxuICAgICAgLnRha2UoMSlcbiAgICAgIC5tYXAoKHNuYXBzaG90KSA9PiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkTG9nID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgIHJldHVybiBuZXcgQnVpbGRTdGVwKFxuICAgICAgICAgICdwaXBlbGluZScsXG4gICAgICAgICAgYnVpbGQuc3RhcnRUaW1lLFxuICAgICAgICAgIF8ubm93KCkgLSBidWlsZC5zdGFydFRpbWUsXG4gICAgICAgICAgJ2ZpbmlzaGVkJyxcbiAgICAgICAgICBocGVTdGF0dXNNYXBwaW5nW2J1aWxkTG9nLnN0YXR1c10pO1xuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgY2hpbGRTdGVwcyhidWlsZCkge1xuICAgIHJldHVybiBGaXJlYmFzZVJ4Lm9uQ2hpbGRDaGFuZ2VkKGJ1aWxkLnJlZi5jaGlsZCgnc3RlcHMnKSlcbiAgICAgIC5maWx0ZXIoc25hcHNob3QgPT4ge1xuICAgICAgICBjb25zdCBzdGVwID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgIHJldHVybiBfLmhhcyhocGVQaXBlbGluZVN0ZXBNYXBwaW5nLCBzdGVwLm5hbWUpICYmXG4gICAgICAgICAgXy5oYXMoaHBlU3RhdHVzTWFwcGluZywgc3RlcC5zdGF0dXMpO1xuICAgICAgfSlcbiAgICAgIC5tYXAoc25hcHNob3QgPT4ge1xuICAgICAgICBjb25zdCBzdGVwID0gc25hcHNob3QudmFsKCk7XG4gICAgICAgIHJldHVybiBuZXcgQnVpbGRTdGVwKFxuICAgICAgICAgIGhwZVBpcGVsaW5lU3RlcE1hcHBpbmdbc3RlcC5uYW1lXSxcbiAgICAgICAgICBzdGVwLmNyZWF0aW9uVGltZVN0YW1wICogMTAwMCxcbiAgICAgICAgICAoc3RlcC5maW5pc2hUaW1lU3RhbXAgLSBzdGVwLmNyZWF0aW9uVGltZVN0YW1wKSAqIDEwMDAsXG4gICAgICAgICAgJ2ZpbmlzaGVkJyxcbiAgICAgICAgICBocGVTdGF0dXNNYXBwaW5nW3N0ZXAuc3RhdHVzXSk7XG4gICAgICB9KTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
