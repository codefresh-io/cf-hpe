import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, objectId } from './model';
import config from './config';

function openBuildLogsRef() {
  return Rx.Observable
    .start(() => new Firebase(config.firebaseUrl))
    .flatMap(rootRef => rootRef.rx_authWithSecretToken(
      config.firebaseSecret,
      'hpe-service',
      { admin: true }))
    .map(rootRef => rootRef.child(config.firebaseBuildLogsPath));
}

function findAccount(accountId) {
  return Rx.Observable
    .fromPromise(() => Account.findOne({ _id: objectId(accountId) }))
    .map(account => account && account.toObject());
}

function isHpeIntegrationAccount(account) {
  return true || account.integrations.hpe && account.integrations.hpe.active;
}

function createBuildStepStatus(stepId, startTime, duration, status, result) {
  return {
    stepId,
    startTime,
    duration,
    status,
    result,
  };
}

class RunningBuild {
  static runningBuilds() {
    return openBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef.limitToFirst(10).rx_onChildAdded())
      .flatMap(buildLog => findAccount(buildLog.val().accountId)
        .filter(account => account && isHpeIntegrationAccount(account))
        .map(() => buildLog))
      .map(buildLog => RunningBuild.runningBuildSteps(buildLog.ref()));
  }

  static runningBuildSteps(buildLogRef) {
    const buildRunningStepObservable = buildLogRef.child('data/started')
      .rx_onValue()
      .filter(snapshot => snapshot.exists())
      .take(1)
      .flatMap(() => buildLogRef.rx_onceValue())
      .map((buildLog) => createBuildStepStatus(
        'root',
        buildLog.val().data.started,
        0,
        'running',
        'unavailable'));

    const buildFinishedStepObservable = buildLogRef.child('data/finished')
      .rx_onValue()
      .filter(snapshot => snapshot.exists())
      .take(1)
      .flatMap(() => buildLogRef.rx_onceValue())
      .map((buildLog) => createBuildStepStatus(
        'root',
        buildLog.val().data.finished,
        buildLog.val().data.finished - buildLog.val().data.started,
        'finished',
        'success'));

    return Rx.Observable.concat(buildRunningStepObservable, buildFinishedStepObservable);
  }
}

export default RunningBuild;
