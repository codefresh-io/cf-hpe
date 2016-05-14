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
  constructor(buildLogRef) {
    this.ref = buildLogRef;
  }

  static builds() {
    return openBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef.limitToFirst(10).rx_onChildAdded())
      .flatMap(buildLog => findAccount(buildLog.val().accountId)
        .filter(account => account && isHpeIntegrationAccount(account))
        .map(() => buildLog))
      .map(buildLog => new RunningBuild(buildLog.ref()));
  }

  static buildSteps(runningBuild) {
    const buildRunningStepObservable = runningBuild.ref.child('data/started')
      .rx_onValue()
      .filter(snapshot => snapshot.exists())
      .take(1)
      .flatMap(() => runningBuild.ref.rx_onceValue())
      .map(snapshot => snapshot.val())
      .map((buildLog) => createBuildStepStatus(
        'root',
        buildLog.data.started,
        0,
        'running',
        'unavailable'));

    const buildFinishedStepObservable = runningBuild.ref.child('data/finished')
      .rx_onValue()
      .filter(snapshot => snapshot.exists())
      .take(1)
      .flatMap(() => runningBuild.ref.rx_onceValue())
      .map(snapshot => snapshot.val())
      .map((buildLog) => createBuildStepStatus(
        'root',
        buildLog.data.finished,
        buildLog.data.finished - buildLog.data.started,
        'finished',
        'success'));

    return Rx.Observable.concat(buildRunningStepObservable, buildFinishedStepObservable);
  }
}

export default RunningBuild;
