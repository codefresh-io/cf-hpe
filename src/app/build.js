import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import Model from './model';
import Logger from 'lib/logger';
import config from './config';

const logger = Logger.getLogger('build');

function openBuildLogsRef() {
  return Rx.Observable
    .start(() => new Firebase(config.firebaseUrl))
    .doOnNext(rootRef => logger.info('Open build logs ref. url (%s)', rootRef.toString()))
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
    .filter(account => {
      if (!account) {
        logger.warn('Build account not found. build (%s)', buildLog.id);
        return false;
      }

      return true;
    })
    .map(account => account.toObject())
    .filter(account => isHpeIntegrationAccount(account));
}

function findService(buildLog) {
  return Rx.Observable
    .fromPromise(() => Model.Build.findOne(
      { progress_id: Model.objectId(buildLog.id) },
      'serviceId'))
    .filter(progress => {
      if (!progress) {
        logger.warn('Build progress not found. build (%s)', buildLog.id);
        return false;
      }

      return true;
    })
    .flatMap(progress => Model.Service.findOne(
      { _id: Model.objectId(progress.get('serviceId')) }))
    .filter(service => {
      if (!service) {
        logger.warn('Build service not found. build (%s)', buildLog.id);
        return false;
      }

      return true;
    })
    .map(service => service.toObject());
}

class Build {
  constructor(ref, id, name, account, service) {
    this.ref = ref;
    this.id = id;
    this.name = name;
    this.account = account;
    this.service = service;
  }

  static builds() {
    return openBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef.rx_onChildAdded())
      .doOnNext(snapshot => logger.info('Receiving build log. build (%s)', snapshot.val().id))
      .flatMap(snapshot =>
        Rx.Observable.zip(
          findAccount(snapshot.val()),
          findService(snapshot.val()),
          (account, service) => new Build(
            snapshot.ref(),
            snapshot.val().id,
            service.name,
            account,
            service)));
  }
}

export default Build;
