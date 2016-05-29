'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BuildStep = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _immutable = require('immutable');

var _firebaseRx = require('../lib/firebase-rx');

var _logger = require('../lib/logger');

var _hpeConfig = require('./hpe-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable new-cap */


var logger = _logger.Logger.create('BuildStep');

var hpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted'
};

hpeStatusMapping.isStatus = function (status) {
  return _ramda2.default.has(status, hpeStatusMapping);
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

hpePipelineStepMapping.isPipelineStep = function (name) {
  return _ramda2.default.has(name, hpePipelineStepMapping);
};

var BuildStep = exports.BuildStep = (0, _immutable.Record)({
  stepId: null,
  startTime: null,
  duration: null,
  status: null,
  result: null
});

BuildStep.stepsFromBuild = function (build) {
  logger.info('Start processing build log steps. build (%s) service (%s)', build.id, build.name);

  var buildRunningStepObservable = BuildStep.runningStep(build).share();
  var finishedStepObservable = BuildStep.finishedStep(build).share();
  var childStepsObservable = BuildStep.childSteps(build).takeUntil(finishedStepObservable).share();

  return _rx2.default.Observable.concat(buildRunningStepObservable, childStepsObservable, finishedStepObservable).timeout(_hpeConfig.HpeConfig.buildTimeout * 1000).catch(function (error) {
    logger.error('Build failed. build (%s) service (%s) error (%s)', build.id, build.name, error);

    return _rx2.default.Observable.of(new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: Date.now() - build.startTime,
      status: 'finished',
      result: 'failure'
    }));
  }).doOnNext(function (buildStep) {
    return logger.info('Build step. build (%s) service (%s) step (%s) status (%s) result (%s)', build.id, build.name, buildStep.stepId, buildStep.status, buildStep.result);
  }).doOnCompleted(function () {
    return logger.info('Build finished. build (%s) service (%s)', build.id, build.name);
  });
};

BuildStep.runningStep = function (build) {
  return _firebaseRx.FirebaseRx.of(build.ref).map(_firebaseRx.FirebaseRx.child('data/started')).flatMap(_firebaseRx.FirebaseRx.onValue).filter(_firebaseRx.FirebaseSnapshotRx.exists).take(1).map(function () {
    return new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: 0,
      status: 'running',
      result: 'unavailable'
    });
  });
};

BuildStep.finishedStep = function (build) {
  return _firebaseRx.FirebaseRx.of(build.ref).map(_firebaseRx.FirebaseRx.child('data/finished')).flatMap(_firebaseRx.FirebaseRx.onValue).filter(_firebaseRx.FirebaseSnapshotRx.exists).take(1).flatMap(_firebaseRx.FirebaseRx.of(build.ref)).flatMap(_firebaseRx.FirebaseRx.onValue).map(_firebaseRx.FirebaseSnapshotRx.val).filter(_ramda2.default.compose(hpeStatusMapping.isStatus, _ramda2.default.prop('status'))).take(1).map(function (buildLog) {
    return new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: Date.now() - build.startTime,
      status: 'finished',
      result: hpeStatusMapping[buildLog.status]
    });
  });
};

BuildStep.childSteps = function (build) {
  var stepsRef = build.ref.child('steps');
  var stepAddedObservable = _firebaseRx.FirebaseRx.onChildAdded(stepsRef);
  var stepChangedObservable = _firebaseRx.FirebaseRx.onChildChanged(stepsRef);

  return _rx2.default.Observable.merge(stepAddedObservable, stepChangedObservable).map(_firebaseRx.FirebaseSnapshotRx.val).filter(_ramda2.default.compose(hpeStatusMapping.isStatus, _ramda2.default.prop('status'))).filter(_ramda2.default.compose(hpePipelineStepMapping.isPipelineStep, _ramda2.default.prop('name'))).distinct(_ramda2.default.prop('name')).map(function (step) {
    return new BuildStep({
      stepId: hpePipelineStepMapping[step.name],
      startTime: step.creationTimeStamp * 1000,
      duration: (step.finishTimeStamp - step.creationTimeStamp) * 1000,
      status: 'finished',
      result: hpeStatusMapping[step.status]
    });
  });
};