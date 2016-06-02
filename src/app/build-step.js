/* eslint-disable new-cap */
import R from 'ramda';
import Rx from 'rx';
import { Record } from 'immutable';
import { FirebaseRx, FirebaseSnapshotRx } from 'lib/firebase-rx';
import { Logger } from 'lib/logger';
import { HpeConfig } from 'app/hpe-config';
import { HpeStatusMapping, HpePipelineStepMapping } from 'app/build-mapping';

const logger = Logger.create('BuildStep');

export const BuildStep = Record({
  ref: null,
  stepId: null,
  startTime: null,
  duration: null,
  status: null,
  result: null,
});

BuildStep.stepsFromBuild = (build) => {
  logger.info(
    'Start processing build log steps. build (%s) service (%s)',
    build.buildId,
    build.serviceName);

  const buildRunningStepObservable = BuildStep.runningStep(build).share();
  const finishedStepObservable = BuildStep.finishedStep(build).share();
  const childStepsObservable = BuildStep.childSteps(build)
    .takeUntil(finishedStepObservable)
    .share();

  return Rx.Observable
    .concat(
      buildRunningStepObservable,
      childStepsObservable,
      finishedStepObservable)
    .timeout(HpeConfig.CF_HPE_BUILD_TIMEOUT * 1000)
    .catch(error => {
      logger.error(
        'Build failed. build (%s) service (%s) error (%s)',
        build.buildId,
        build.serviceName,
        error);

      return Rx.Observable.just(
        new BuildStep({
          stepId: 'pipeline',
          startTime: build.startTime,
          duration: Date.now() - build.startTime,
          status: 'finished',
          result: 'failure',
        }));
    })
    .doOnNext(buildStep => logger.info(
      'Build step. build (%s) service (%s) step (%s) status (%s) result (%s)',
      build.buildId,
      build.serviceName,
      buildStep.stepId,
      buildStep.status,
      buildStep.result))
    .doOnCompleted(() => logger.info(
      'Build finished. build (%s) service (%s)',
      build.buildId,
      build.serviceName));
};

BuildStep.runningStep = (build) =>
  FirebaseRx.of(build.ref)
    .map(FirebaseRx.child('data/started'))
    .flatMap(FirebaseRx.onValue)
    .filter(FirebaseSnapshotRx.exists)
    .take(1)
    .map(() =>
      new BuildStep({
        stepId: 'pipeline',
        startTime: build.startTime,
        duration: 0,
        status: 'running',
        result: 'unavailable',
      }));

BuildStep.finishedStep = (build) =>
  FirebaseRx.of(build.ref)
    .map(FirebaseRx.child('data/finished'))
    .flatMap(FirebaseRx.onValue)
    .filter(FirebaseSnapshotRx.exists)
    .take(1)
    .flatMap(FirebaseRx.of(build.ref))
    .flatMap(FirebaseRx.onValue)
    .map(FirebaseSnapshotRx.val)
    .filter(R.compose(HpeStatusMapping.isStatus, R.prop('status')))
    .take(1)
    .map(buildLog => new BuildStep({
      stepId: 'pipeline',
      startTime: build.startTime,
      duration: Date.now() - build.startTime,
      status: 'finished',
      result: HpeStatusMapping[buildLog.status],
    }));

BuildStep.childSteps = (build) => {
  const stepsRef = build.ref.child('steps');
  const stepAddedObservable = FirebaseRx.onChildAdded(stepsRef);
  const stepChangedObservable = FirebaseRx.onChildChanged(stepsRef);

  return Rx.Observable
    .merge(stepAddedObservable, stepChangedObservable)
    .filter(R.compose(HpeStatusMapping.isStatus, FirebaseSnapshotRx.prop('status')))
    .filter(R.compose(HpePipelineStepMapping.isPipelineStep, FirebaseSnapshotRx.prop('name')))
    .distinct(FirebaseSnapshotRx.prop('name'))
    .map(snapshot => {
      const step = FirebaseSnapshotRx.val(snapshot);
      return new BuildStep({
        ref: snapshot.ref(),
        stepId: HpePipelineStepMapping[step.name],
        startTime: step.creationTimeStamp * 1000,
        duration: (step.finishTimeStamp - step.creationTimeStamp) * 1000,
        status: 'finished',
        result: HpeStatusMapping[step.status],
      });
    });
};

BuildStep.childStepLogs = (buildStep) => {
  const stepsLogsRef = buildStep.ref.child('logs');
  const stepLogsAddedObservable = FirebaseRx.onChildAdded(stepsLogsRef);
  return stepLogsAddedObservable.map(FirebaseSnapshotRx.val);
};
