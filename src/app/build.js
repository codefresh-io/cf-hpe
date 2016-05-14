import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import Model from './model';
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

function isHpeIntegrationAccount(account) {
  return true || account.integrations.hpe && account.integrations.hpe.active;
}

function findAccount(buildLog) {
  return Rx.Observable
    .fromPromise(() => Model.Account.findOne({ _id: Model.objectId(buildLog.accountId) }))
    .filter(account => account)
    .map(account => account.toObject())
    .filter(account => isHpeIntegrationAccount(account));
}

function findService(buildLog) {
  return Rx.Observable
    .fromPromise(() => Model.Build.findOne(
      { progress_id: Model.objectId(buildLog.id) },
      'serviceId'))
    .filter(progress => progress)
    .flatMap(progress => Model.Service.findOne(
      { _id: Model.objectId(progress.get('serviceId')) }))
    .filter(service => service)
    .map(service => service.toObject());
}

class Build {
  constructor(ref, account, service, progressId) {
    this.ref = ref;
    this.account = account;
    this.service = service;
    this.progressId = progressId;
  }

  static builds() {
    return openBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef.limitToFirst(10).rx_onChildAdded())
      .flatMap(snapshot =>
        Rx.Observable.zip(
          findAccount(snapshot.val()),
          findService(snapshot.val()),
          (account, service) => new Build(
            snapshot.ref(),
            account,
            service,
            snapshot.val().id)));
  }
}

export default Build;
