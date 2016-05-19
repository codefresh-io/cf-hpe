import _ from 'lodash';
import Rx from 'rx';
import { FirebaseRx } from 'firebase-rx';
import { Logger } from 'lib/logger';
import { HpeConfig } from 'app/hpe-config';

const logger = Logger.getLogger('BuildStep');

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

export class BuildStep {
  constructor(stepId, startTime, duration, status, result) {
    this.stepId = stepId;
    this.startTime = startTime;
    this.duration = duration;
    this.status = status;
    this.result = result;
  }

  static steps(build) {
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
          new BuildStep(
            'pipeline',
            build.startTime,
            _.now() - build.startTime,
            'finished',
            'failure'));
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
  }

  static runningStep(build) {
    return FirebaseRx.onValue(build.ref.child('data/started'))
      .filter(snapshot => snapshot.exists())
      .take(1)
      .map(() => {
        return new BuildStep(
          'pipeline',
          build.startTime,
          null,
          'running',
          'unavailable');
      });
  }

  static finishedStep(build) {
    return FirebaseRx.onValue(build.ref.child('data/finished'))
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
        return new BuildStep(
          'pipeline',
          build.startTime,
          _.now() - build.startTime,
          'finished',
          hpeStatusMapping[buildLog.status]);
      });
  }

  static childSteps(build) {
    return FirebaseRx.onChildChanged(build.ref.child('steps'))
      .filter(snapshot => {
        const step = snapshot.val();
        return _.has(hpePipelineStepMapping, step.name) &&
          _.has(hpeStatusMapping, step.status);
      })
      .map(snapshot => {
        const step = snapshot.val();
        return new BuildStep(
          hpePipelineStepMapping[step.name],
          step.creationTimeStamp * 1000,
          (step.finishTimeStamp - step.creationTimeStamp) * 1000,
          'finished',
          hpeStatusMapping[step.status]);
      });
  }
}
