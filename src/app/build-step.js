import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Logger from 'lib/logger';
import config from './config';

const logger = Logger.getLogger('build-step');

const hpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted',
};

function mapBuildLogStepToPipelineStep(name) {
  if (name === 'Initializing Process') {
    return 'clone-repository';
  }

  if (name === 'Building Docker Image') {
    return 'build-dockerfile';
  }

  if (name === 'Saving Image to Local Storage') {
    return 'push-docker-registry';
  }

  if (name === 'Running Unit Tests') {
    return 'unit-test-script';
  }
}

class BuildStep {
  constructor(stepId, startTime, duration, status, result) {
    this.stepId = stepId;
    this.startTime = startTime;
    this.duration = duration;
    this.status = status;
    this.result = result;
  }

  static steps(build) {
    const buildRunningStepObservable = build.ref.child('data/started')
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

    const buildFinishedStepObservable = build.ref.child('data/finished')
      .rx_onValue()
      .filter(snapshot => snapshot.exists())
      .take(1)
      .flatMap(() => build.ref.rx_onValue())
      .filter(snapshot => {
        const buildLog = snapshot.val();
        return _.has(hpeStatusMapping, buildLog.status);
      })
      .take(1)
      .map((snapshot) => {
        const buildLog = snapshot.val();
        logger.info(
          'Build finished. build (%s) status (%s)',
          build.id,
          buildLog.status);

        return new BuildStep(
          'pipeline',
          build.startTime,
          _.now() - build.startTime,
          'finished',
          hpeStatusMapping[buildLog.status]);
      });

    return Rx.Observable
      .concat(buildRunningStepObservable, buildFinishedStepObservable)
      .timeout(config.buildTimeout * 1000)
      .catch(error => {
        logger.error('Build failed. build (%s) error (%s)', build.id, error);
        return Rx.Observable.just(
          new BuildStep(
            'pipeline',
            build.startTime,
            _.now() - build.startTime,
            'finished',
            'failure'));
      });
  }
}

export default BuildStep;
