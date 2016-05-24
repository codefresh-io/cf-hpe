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

var _firebaseRx = require('firebase-rx');

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

var hpePipelineStepMapping = {
  'Initializing Process': 'clone-repository',
  'Building Docker Image': 'build-dockerfile',
  'Running Unit Tests': 'unit-test-script',
  'Pushing to Docker Registry': 'push-docker-registry',
  'Running Integration Tests': 'integration-test-script',
  'security-validation': 'security-validation',
  'Running Deploy script': 'deploy-script'
};

var BuildStep = exports.BuildStep = (0, _immutable.Record)({
  stepId: null,
  startTime: null,
  duration: null,
  status: null,
  result: null
});

BuildStep.steps = function (build) {
  logger.info('Processing build log steps. build (%s) service (%s)', build.id, build.name);
  var buildRunningStep = BuildStep.runningStep(build);
  var finishedStep = BuildStep.finishedStep(build);
  var childSteps = BuildStep.childSteps(build).takeUntil(finishedStep);

  return _rx2.default.Observable.concat(buildRunningStep, childSteps, finishedStep).timeout(_hpeConfig.HpeConfig.buildTimeout * 1000).catch(function (error) {
    logger.error('Build failed. build (%s) service (%s) error (%s)', build.id, build.name, error);

    return _rx2.default.Observable.just(new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: Date.now() - build.startTime,
      status: 'finished',
      result: 'failure'
    }));
  }).doOnNext(function (buildStep) {
    logger.info('Build step. build (%s) service (%s) step (%s) status (%s) result (%s)', build.id, build.name, buildStep.stepId, buildStep.status, buildStep.result);
  }).doOnCompleted(function () {
    logger.info('Build finished. build (%s) service (%s)', build.id, build.name);
  });
};

BuildStep.runningStep = function (build) {
  return _firebaseRx.FirebaseRx.onValue(build.ref.child('data/started')).filter(function (snapshot) {
    return snapshot.exists();
  }).take(1).map(function () {
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
  return _firebaseRx.FirebaseRx.onValue(build.ref.child('data/finished')).filter(function (snapshot) {
    return snapshot.exists();
  }).take(1).flatMap(function () {
    return _firebaseRx.FirebaseRx.onValue(build.ref);
  }).filter(function (snapshot) {
    var buildLog = snapshot.val();
    return _ramda2.default.has(buildLog.status, hpeStatusMapping);
  }).take(1).map(function (snapshot) {
    var buildLog = snapshot.val();
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
  return _firebaseRx.FirebaseRx.onChildChanged(build.ref.child('steps')).filter(function (snapshot) {
    var step = snapshot.val();
    return _ramda2.default.has(step.name, hpePipelineStepMapping) && _ramda2.default.has(step.status, hpeStatusMapping);
  }).map(function (snapshot) {
    var step = snapshot.val();
    return new BuildStep({
      stepId: hpePipelineStepMapping[step.name],
      startTime: step.creationTimeStamp * 1000,
      duration: (step.finishTimeStamp - step.creationTimeStamp) * 1000,
      status: 'finished',
      result: hpeStatusMapping[step.status]
    });
  });
};