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

var _buildMapping = require('./build-mapping');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _logger.Logger.create('BuildStep'); /* eslint-disable new-cap */


var BuildStep = exports.BuildStep = (0, _immutable.Record)({
  ref: null,
  stepId: null,
  startTime: null,
  duration: null,
  status: null,
  result: null
});

BuildStep.buildStepError = function (build, error) {
  return _rx2.default.Observable.just({}).doOnNext(function () {
    return logger.error('Build failed. account (%s) service (%s) build (%s) error (%s)', build.accountName, build.serviceName, build.buildId, error);
  }).map(function () {
    return new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: Date.now() - build.startTime,
      status: 'finished',
      result: 'failure'
    });
  });
};

BuildStep.stepsFromBuild = function (build) {
  var runningStepObservable = BuildStep.runningStep(build).share();
  var finishedStepObservable = BuildStep.finishedStep(build).share();
  var childStepsObservable = BuildStep.childSteps(build).takeUntil(finishedStepObservable).share();

  return _rx2.default.Observable.just({}).doOnNext(function () {
    return logger.info('Start processing build log steps. account (%s) service (%s) build (%s)', build.accountName, build.serviceName, build.buildId);
  }).flatMap(_rx2.default.Observable.concat(runningStepObservable, childStepsObservable, finishedStepObservable)).timeout(_hpeConfig.HpeConfig.CF_HPE_BUILD_TIMEOUT * 1000).catch(function (error) {
    return BuildStep.buildStepError(build, error);
  }).doOnNext(function (buildStep) {
    return logger.info('Build step. account (%s) service (%s) build (%s) step (%s) status (%s) result (%s)', build.accountName, build.serviceName, build.buildId, buildStep.stepId, buildStep.status, buildStep.result);
  }).doOnCompleted(function () {
    return logger.info('Build finished. account (%s) service (%s) build (%s)', build.accountName, build.serviceName, build.buildId);
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
  }).timeout(5000);
};

BuildStep.finishedStep = function (build) {
  return _firebaseRx.FirebaseRx.of(build.ref).map(_firebaseRx.FirebaseRx.child('data/finished')).flatMap(_firebaseRx.FirebaseRx.onValue).filter(_firebaseRx.FirebaseSnapshotRx.exists).take(1).flatMap(_firebaseRx.FirebaseRx.of(build.ref)).flatMap(_firebaseRx.FirebaseRx.onValue).map(_firebaseRx.FirebaseSnapshotRx.val).filter(_ramda2.default.compose(_buildMapping.HpeStatusMapping.isStatus, _ramda2.default.prop('status'))).take(1).map(function (buildLog) {
    return new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: Date.now() - build.startTime,
      status: 'finished',
      result: _buildMapping.HpeStatusMapping[buildLog.status]
    });
  });
};

BuildStep.childSteps = function (build) {
  var stepsRef = build.ref.child('steps');
  var stepAddedObservable = _firebaseRx.FirebaseRx.onChildAdded(stepsRef);
  var stepChangedObservable = _firebaseRx.FirebaseRx.onChildChanged(stepsRef);

  return _rx2.default.Observable.merge(stepAddedObservable, stepChangedObservable).filter(_ramda2.default.compose(_buildMapping.HpeStatusMapping.isStatus, _firebaseRx.FirebaseSnapshotRx.prop('status'))).filter(_ramda2.default.compose(_buildMapping.HpePipelineStepMapping.isPipelineStep, _firebaseRx.FirebaseSnapshotRx.prop('name'))).distinct(_firebaseRx.FirebaseSnapshotRx.prop('name')).map(function (snapshot) {
    var step = _firebaseRx.FirebaseSnapshotRx.val(snapshot);
    return new BuildStep({
      ref: snapshot.ref(),
      stepId: _buildMapping.HpePipelineStepMapping[step.name],
      startTime: step.creationTimeStamp * 1000,
      duration: (step.finishTimeStamp - step.creationTimeStamp) * 1000,
      status: 'finished',
      result: _buildMapping.HpeStatusMapping[step.status]
    });
  });
};

BuildStep.childStepLogs = function (buildStep) {
  var stepsLogsRef = buildStep.ref.child('logs');
  var stepLogsAddedObservable = _firebaseRx.FirebaseRx.onChildAdded(stepsLogsRef);
  return stepLogsAddedObservable.map(_firebaseRx.FirebaseSnapshotRx.val);
};