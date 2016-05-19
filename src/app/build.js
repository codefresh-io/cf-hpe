import _ from 'lodash';
import Rx from 'rx';
import Firebase from 'firebase';
import { FirebaseRx } from 'firebase-rx';
import { Logger } from 'lib/logger';
import { Model } from 'app/model';
import { HpeConfig } from 'app/hpe-config';

const logger = Logger.getLogger('Build');

export class Build {

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
      .flatMap(buildLogsRef => {
        const query = buildLogsRef
          .orderByChild('data/started')
          .startAt(_.now() / 1000);
        return FirebaseRx.onChildAdded(query);
      })
      .flatMap(snapshot => {
        logger.info('New build log. build (%s)', snapshot.key());
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
      .start(() => new Firebase(HpeConfig.firebaseBuildLogsUrl))
      .flatMap(buildLogs => {
        logger.info('Open build logs ref. url (%s)', buildLogs.toString());
        return FirebaseRx.authWithSecretToken(
          buildLogs,
          HpeConfig.firebaseSecret,
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
        { _id: Model.toObjectId(buildLogSnapshot.val().accountId) }))
      .filter(account => {
        if (!account) {
          logger.warn('Build account not found. build (%s)', buildLogSnapshot.key());
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
        { progress_id: Model.toObjectId(buildLogSnapshot.key()) },
        'serviceId'))
      .filter(progress => {
        if (!progress) {
          logger.warn('Build progress not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      })
      .flatMap(progress => Model.Service.findOne(
        { _id: Model.toObjectId(progress.get('serviceId')) }))
      .filter(service => {
        if (!service) {
          logger.warn('Build service not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      })
      .map(service => service.toObject());
  }
}
