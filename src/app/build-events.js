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

function getBuildLogsEvents(buildLogsRef) {
  return buildLogsRef
    .orderByChild('lastUpdate')
    .startAt(0)
    .limitToLast(5)
    .rx_onChildAdded()
    .map(snapshot => snapshot.val());
}

function findAccount(accountId) {
  return Rx.Observable
    .fromPromise(() => Account.findOne({ _id: objectId(accountId) }))
    .map(account => account && account.toObject());
}

function isHpeIntegrationAccount(account) {
  return true || account.integrations.hpe && account.integrations.hpe.active;
}

function getIntegrationBuildEvents(buildEvent) {
  return findAccount(buildEvent.accountId)
    .filter(account => account && isHpeIntegrationAccount(account))
    .map(() => buildEvent);
}

class BuildEvents {
  static create() {
    return Rx.Observable.defer(() => {
      const buildLogsRef = getBuildLogsRef(_config).shareReplay();
      const buildLogsEvents = buildLogsRef.flatMap(getBuildLogsEvents);
      const integrationBuildEvents = buildLogsEvents.flatMap(getIntegrationBuildEvents);
      return integrationBuildEvents;
    });
  }
}

export default BuildEvents;
