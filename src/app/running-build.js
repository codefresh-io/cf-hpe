import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, objectId } from './model';
import _config from './config';

function getBuildLogsRef(config) {
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
    .orderByChild('lastUpdate')
    .startAt(0)
    .limitToLast(5)
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

function getIntegrationBuildLogs(buildLogRef) {
  return findAccount(buildLogRef.val().accountId)
    .filter(account => account && isHpeIntegrationAccount(account))
    .map(() => buildLogRef);
}

class RunningBuild {
  static create() {
    return Rx.Observable.defer(() => {
      const buildLogsRef = getBuildLogsRef(_config).shareReplay();
      const startedBuildLogs = buildLogsRef.flatMap(getStartedBuildLogs);
      const integrationBuildLogs = startedBuildLogs.flatMap(getIntegrationBuildLogs);
      return integrationBuildLogs;
    });
  }
}

export default RunningBuild;
