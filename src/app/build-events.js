import 'firebase-rx';
import Rx from 'rx';
import Firebase from 'firebase';
import { Account, Service, Build, objectId } from './model';
import config from './config';

class BuildEvents {
  static getBuildLogsRef() {
    return Rx.Observable
      .start(() => new Firebase(config.firebaseUrl))
      .flatMap(rootRef => rootRef.rx_authWithSecretToken(
        config.firebaseSecret,
        'hpe-service',
        { admin: true }))
      .map(rootRef => rootRef.child(config.firebaseBuildLogsPath));
  }

  static getBuildLogsEvents() {
    return BuildEvents
      .getBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef
        .orderByChild('lastUpdate')
        .startAt(0)
        .limitToLast(10)
        .rx_onChildAdded())
      .map(snapshot => snapshot.val())
      .flatMap(buildLog =>
        BuildEvents
          .findAccount(buildLog.accountId)
          .filter(account => {
            return true || account && account.integrations.hpe && account.integrations.hpe.active;
          })
          .map(() => buildLog));
  }

  static findAccount(accountId) {
    return Rx.Observable
      .fromPromise(() => Account.findOne({ _id: objectId(accountId) }))
      .takeWhile(account => account)
      .map(account => account.toObject())
      .defaultIfEmpty(null);
  }

  static findServiceByProgressId(progressId) {
    return Rx.Observable
      .fromPromise(() => Build.findOne({ progress_id: objectId(progressId) }, 'serviceId'))
      .takeWhile(progress => progress)
      .flatMap(progress => Service.findOne({ _id: objectId(progress.get('serviceId')) }))
      .takeWhile(service => service)
      .map(service => service.toObject())
      .defaultIfEmpty(null);
  }
}

export default BuildEvents;
