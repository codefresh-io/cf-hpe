import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, Service, Build, objectId } from './model';
import config from './config';

class BuildEvents {
  constructor() {
    this.config = config;
    this.buildLogsRef = this.getBuildLogsRef().single();
  }

  getBuildLogsRef() {
    return Rx.Observable
      .start(() => new Firebase(config.firebaseUrl))
      .flatMap(rootRef => rootRef.rx_authWithSecretToken(
        config.firebaseSecret,
        'hpe-service',
        { admin: true }))
      .map(rootRef => rootRef.child(config.firebaseBuildLogsPath));
  }

  getBuildStartedEvents() {
    return this.buildLogsRef
      .flatMap(buildLogsRef => buildLogsRef
        .orderByChild('lastUpdate')
        .startAt(0)
        .limitToLast(10)
        .rx_onChildAdded())
      .map(snapshot => snapshot.val())
      .flatMap(buildLog =>
        this
          .findAccount(buildLog.accountId)
          .filter(account => account && this.isHpeIntegrationAccount(account))
          .map(() => buildLog));
  }

  findAccount(accountId) {
    return Rx.Observable
      .fromPromise(() => Account.findOne({ _id: objectId(accountId) }))
      .takeWhile(account => account)
      .map(account => account.toObject())
      .defaultIfEmpty(null);
  }

  isHpeIntegrationAccount(account) {
    return true || account.integrations.hpe && account.integrations.hpe.active;
  }
}

export default BuildEvents;
