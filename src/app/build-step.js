import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Logger from 'lib/logger';
import config from './config';

const _logger = Logger.getLogger('build-step');

const _hpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted',
};

const _hpePipelineStepMapping = {
  'Initializing Process': 'clone-repository',
  'Building Docker Image': 'build-dockerfile',
  'Running Unit Tests': 'unit-test-script',
  'Pushing to Docker Registry': 'push-docker-registry',
  'Running Integration Tests': 'integration-test-script',
  'security-validation': 'security-validation',
  'Running Deploy script': 'deploy-script',
};

class BuildStep {
  constructor(stepId, startTime, duration, status, result) {
    this.stepId = stepId;
    this.startTime = startTime;
    this.duration = duration;
    this.status = status;
    this.result = result;
  }

  static steps(build) {
    const buildRunningStep = BuildStep._runningStep(build);
    const finishedStep = BuildStep._finishedStep(build);
    const childSteps = BuildStep._childSteps(build).takeUntil(finishedStep);

    return Rx.Observable
      .concat(
        buildRunningStep,
        childSteps,
        finishedStep)
      .timeout(config.buildTimeout * 1000)
      .catch(error => {
        _logger.error('Build failed. build (%s) error (%s)', build.id, error);
        return Rx.Observable.just(
          new BuildStep(
            'pipeline',
            build.startTime,
            _.now() - build.startTime,
            'finished',
            'failure'));
      })
      .doOnNext(buildStep => {
        _logger.info(
          'Build step. build (%s) step (%s) status (%s) result (%s)',
          build.id,
          buildStep.stepId,
          buildStep.status,
          buildStep.result);
      });
  }

  static _runningStep(build) {
    return build.ref.child('data/started')
      .rx_onValue()
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

  static _finishedStep(build) {
    return build.ref.child('data/finished')
      .rx_onValue()
      .filter(snapshot => snapshot.exists())
      .take(1)
      .flatMap(() => build.ref.rx_onValue())
      .filter(snapshot => {
        const buildLog = snapshot.val();
        return _.has(_hpeStatusMapping, buildLog.status);
      })
      .take(1)
      .map((snapshot) => {
        const buildLog = snapshot.val();
        return new BuildStep(
          'pipeline',
          build.startTime,
          _.now() - build.startTime,
          'finished',
          _hpeStatusMapping[buildLog.status]);
      });
  }

  static _childSteps(build) {
    return build.ref.child('steps')
      .rx_onChildChanged()
      .filter(snapshot => {
        const step = snapshot.val();
        return _.has(_hpePipelineStepMapping, step.name) &&
          _.has(_hpeStatusMapping, step.status);
      })
      .map(snapshot => {
        const step = snapshot.val();
        return new BuildStep(
          _hpePipelineStepMapping[step.name],
          step.creationTimeStamp * 1000,
          (step.finishTimeStamp - step.creationTimeStamp) * 1000,
          'finished',
          _hpeStatusMapping[step.status]);
      });
  }
}

export default BuildStep;
