import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, objectId } from './model';
import config from './config';

function getBuildLogsRef() {
  return Rx.Observable
    .start(() => new Firebase(config.firebaseUrl))
    .flatMap(rootRef => rootRef.rx_authWithSecretToken(
      config.firebaseSecret,
      'hpe-service',
      { admin: true }))
    .map(rootRef => rootRef.child(config.firebaseBuildLogsPath));
}

function getStartedBuildLogs(buildLogsRef) {
  return buildLogsRef
    .limitToFirst(10)
    .rx_onChildAdded();
}

function findAccount(accountId) {
  return Rx.Observable
    .fromPromise(() => Account.findOne({ _id: objectId(accountId) }))
    .map(account => account && account.toObject());
}

function isHpeIntegrationAccount(account) {
  return true || account.integrations.hpe && account.integrations.hpe.active;
}

function filterIntegrationBuildLogs(buildLog) {
  return findAccount(buildLog.val().accountId)
    .filter(account => account && isHpeIntegrationAccount(account))
    .map(() => buildLog);
}

class RunningBuild {
  static getRunningBuilds() {
    return Rx.Observable.defer(() => {
      const buildLogsRef = getBuildLogsRef().shareReplay();
      const startedBuildLogs = buildLogsRef.flatMap(getStartedBuildLogs);
      const integrationBuildLogs = startedBuildLogs
        .flatMap(filterIntegrationBuildLogs)
        .map(buildLog => buildLog.ref());
      return integrationBuildLogs;
    });
  }
}

export default RunningBuild;
