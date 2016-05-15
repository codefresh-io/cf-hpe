import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import Model from './model';
import Logger from 'lib/logger';
import config from './config';

const logger = Logger.getLogger('build');

class Build {
  constructor(ref, id, name, account, service) {
    this.ref = ref;
    this.id = id;
    this.name = name;
    this.account = account;
    this.service = service;
    this.startTime = _.now();
  }

  static builds() {
    return openBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef
        .orderByChild('data/started')
        .startAt(_.now() / 1000)
        .rx_onChildAdded())
      .flatMap(snapshot => {
        logger.info('Receiving build log. build (%s)', snapshot.key());
        return Rx.Observable.zip(
          findAccount(snapshot),
          findService(snapshot),
          (account, service) => new Build(
            snapshot.ref(),
            snapshot.key(),
            service.name,
            account,
            service));
      });
  }
}

function openBuildLogsRef() {
  return Rx.Observable
    .start(() => new Firebase(config.firebaseBuildLogsUrl))
    .flatMap(buildLogs => {
      logger.info('Open build logs ref. url (%s)', buildLogs.toString());
      return buildLogs.rx_authWithSecretToken(
        config.firebaseSecret,
        'hpe-service',
        { admin: true });
    });
}

function isHpeIntegrationAccount(account) {
  return account.name === 'liorshalev01' ||
    account.integrations.hpe && account.integrations.hpe.active;
}

function findAccount(buildLogSnapshot) {
  return Rx.Observable
    .fromPromise(() => Model.Account.findOne(
      { _id: Model.objectId(buildLogSnapshot.val().accountId) }))
    .filter(account => {
      if (!account) {
        logger.warn('Build account not found. build (%s)', buildLogSnapshot.key());
        return false;
      }

      return true;
    })
    .map(account => account.toObject())
    .filter(account => isHpeIntegrationAccount(account));
}

function findService(buildLogSnapshot) {
  return Rx.Observable
    .fromPromise(() => Model.Build.findOne(
      { progress_id: Model.objectId(buildLogSnapshot.key()) },
      'serviceId'))
    .filter(progress => {
      if (!progress) {
        logger.warn('Build progress not found. build (%s)', buildLogSnapshot.key());
        return false;
      }

      return true;
    })
    .flatMap(progress => Model.Service.findOne(
      { _id: Model.objectId(progress.get('serviceId')) }))
    .filter(service => {
      if (!service) {
        logger.warn('Build service not found. build (%s)', buildLogSnapshot.key());
        return false;
      }

      return true;
    })
    .map(service => service.toObject());
}

export default Build;
