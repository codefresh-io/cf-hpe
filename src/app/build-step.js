/* eslint-disable new-cap */
import _ from 'lodash';
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

BuildStep.steps = (build) => {
  logger.info('Processing build log steps. build (%s) service (%s)', build.id, build.name);
  const buildRunningStep = BuildStep.runningStep(build);
  const finishedStep = BuildStep.finishedStep(build);
  const childSteps = BuildStep.childSteps(build).takeUntil(finishedStep);

  return Rx.Observable
    .concat(
      buildRunningStep,
      childSteps,
      finishedStep)
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
  FirebaseRx.onValue(build.ref.child('data/started'))
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
  FirebaseRx.onValue(build.ref.child('data/finished'))
    .filter(snapshot => snapshot.exists())
    .take(1)
    .flatMap(() => FirebaseRx.onValue(build.ref))
    .filter(snapshot => {
      const buildLog = snapshot.val();
      return _.has(hpeStatusMapping, buildLog.status);
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

BuildStep.childSteps = (build) =>
  FirebaseRx.onChildChanged(build.ref.child('steps'))
    .filter(snapshot => {
      const step = snapshot.val();
      return _.has(hpePipelineStepMapping, step.name) &&
        _.has(hpeStatusMapping, step.status);
    })
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
