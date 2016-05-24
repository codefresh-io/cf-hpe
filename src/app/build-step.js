/* eslint-disable new-cap */
import R from 'ramda';
import Rx from 'rx';
import { Record } from 'immutable';
import { FirebaseRx } from 'firebase-rx';
import { Logger } from 'lib/logger';
import { HpeConfig } from 'app/hpe-config';

const logger = Logger.create('BuildStep');

const hpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted',
};

const hpePipelineStepMapping = {
  'Initializing Process': 'clone-repository',
  'Building Docker Image': 'build-dockerfile',
  'Running Unit Tests': 'unit-test-script',
  'Pushing to Docker Registry': 'push-docker-registry',
  'Running Integration Tests': 'integration-test-script',
  'security-validation': 'security-validation',
  'Running Deploy script': 'deploy-script',
};

export const BuildStep = Record({
  stepId: null,
  startTime: null,
  duration: null,
  status: null,
  result: null,
});

BuildStep.stepsFromBuild = (build) => {
  logger.info('Processing build log steps. build (%s) service (%s)', build.id, build.name);
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
    .timeout(HpeConfig.buildTimeout * 1000)
    .catch(error => {
      logger.error(
        'Build failed. build (%s) service (%s) error (%s)',
        build.id,
        build.name,
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
    .doOnNext(buildStep => {
      logger.info(
        'Build step. build (%s) service (%s) step (%s) status (%s) result (%s)',
        build.id,
        build.name,
        buildStep.stepId,
        buildStep.status,
        buildStep.result);
    })
    .doOnCompleted(() => {
      logger.info('Build finished. build (%s) service (%s)', build.id, build.name);
    });
};

BuildStep.runningStep = (build) =>
  FirebaseRx
    .onValue(build.ref.child('data/started'))
    .filter(snapshot => snapshot.exists())
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
  FirebaseRx
    .onValue(build.ref.child('data/finished'))
    .filter(snapshot => snapshot.exists())
    .take(1)
    .flatMap(() => FirebaseRx.onValue(build.ref))
    .filter(snapshot => {
      const buildLog = snapshot.val();
      return R.has(buildLog.status, hpeStatusMapping);
    })
    .take(1)
    .map((snapshot) => {
      const buildLog = snapshot.val();
      return new BuildStep({
        stepId: 'pipeline',
        startTime: build.startTime,
        duration: Date.now() - build.startTime,
        status: 'finished',
        result: hpeStatusMapping[buildLog.status],
      });
    });

BuildStep.childSteps = (build) => {
  const stepsRef = build.ref.child('steps');
  const stepAddedObservable = FirebaseRx.onChildAdded(stepsRef);
  const stepChangedObservable = FirebaseRx.onChildChanged(stepsRef);

  return Rx.Observable
    .merge(stepAddedObservable, stepChangedObservable)
    .filter(snapshot => {
      const step = snapshot.val();
      return R.has(step.name, hpePipelineStepMapping) && R.has(step.status, hpeStatusMapping);
    })
    .distinct(snapshot => snapshot.val().name)
    .map(snapshot => {
      const step = snapshot.val();
      return new BuildStep({
        stepId: hpePipelineStepMapping[step.name],
        startTime: step.creationTimeStamp * 1000,
        duration: (step.finishTimeStamp - step.creationTimeStamp) * 1000,
        status: 'finished',
        result: hpeStatusMapping[step.status],
      });
    });
};
