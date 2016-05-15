import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import Model from './model';
import Logger from 'lib/logger';
import config from './config';

const _logger = Logger.getLogger('build');

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
    return Build._openBuildLogsRef()
      .flatMap(buildLogsRef => buildLogsRef
        .orderByChild('data/started')
        .startAt(_.now() / 1000)
        .rx_onChildAdded())
      .flatMap(snapshot => {
        _logger.info('Receiving build log. build (%s)', snapshot.key());
        return Rx.Observable.zip(
          Build._findAccount(snapshot),
          Build._findService(snapshot),
          (account, service) => new Build(
            snapshot.ref(),
            snapshot.key(),
            service.name,
            account,
            service));
      });
  }

  static _openBuildLogsRef() {
    return Rx.Observable
      .start(() => new Firebase(config.firebaseBuildLogsUrl))
      .flatMap(buildLogs => {
        _logger.info('Open build logs ref. url (%s)', buildLogs.toString());
        return buildLogs.rx_authWithSecretToken(
          config.firebaseSecret,
          'hpe-service',
          { admin: true });
      });
  }

  static _isHpeIntegrationAccount(account) {
    return true || account.integrations.hpe && account.integrations.hpe.active;
  }

  static _findAccount(buildLogSnapshot) {
    return Rx.Observable
      .fromPromise(() => Model.Account.findOne(
        { _id: Model.objectId(buildLogSnapshot.val().accountId) }))
      .filter(account => {
        if (!account) {
          _logger.warn('Build account not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      })
      .map(account => account.toObject())
      .filter(account => Build._isHpeIntegrationAccount(account));
  }

  static _findService(buildLogSnapshot) {
    return Rx.Observable
      .fromPromise(() => Model.Build.findOne(
        { progress_id: Model.objectId(buildLogSnapshot.key()) },
        'serviceId'))
      .filter(progress => {
        if (!progress) {
          _logger.warn('Build progress not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      })
      .flatMap(progress => Model.Service.findOne(
        { _id: Model.objectId(progress.get('serviceId')) }))
      .filter(service => {
        if (!service) {
          _logger.warn('Build service not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      })
      .map(service => service.toObject());
  }
}

export default Build;
