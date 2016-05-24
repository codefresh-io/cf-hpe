/* eslint-disable new-cap */
import Rx from 'rx';
import { Record } from 'immutable';
import Firebase from 'firebase';
import { FirebaseRx } from 'firebase-rx';
import { Logger } from 'lib/logger';
import { Model } from 'app/model';
import { HpeConfig } from 'app/hpe-config';

const logger = Logger.create('Build');

export const Build = Record({
  ref: null,
  id: null,
  name: null,
  account: null,
  service: null,
  startTime: null,
});

Build.buildsFromFirebase = () =>
  Build
    .openBuildLogsRef()
    .flatMap(buildLogsRef => {
      const query = buildLogsRef
        .orderByChild('data/started')
        .startAt(Date.now() / 1000);
      return FirebaseRx.onChildAdded(query);
    })
    .flatMap(snapshot => {
      logger.info('New build started. build (%s)', snapshot.key());
      return Rx.Observable.zip(
        Build.findAccount(snapshot),
        Build.findService(snapshot),
        (account, service) => new Build({
          ref: snapshot.ref(),
          id: snapshot.key(),
          name: service.name,
          account,
          service,
          startTime: Date.now(),
        }));
    });

Build.openBuildLogsRef = () =>
  Rx.Observable
    .start(() => new Firebase(HpeConfig.firebaseBuildLogsUrl))
    .flatMap(buildLogs => {
      logger.info('Open build logs ref. url (%s)', buildLogs.toString());
      return FirebaseRx.authWithSecretToken(
        buildLogs,
        HpeConfig.firebaseSecret,
        'hpe-service',
        { admin: true });
    });

Build.isHpeIntegrationAccount = (account) =>
  (true || account.integrations.hpe && account.integrations.hpe.active);

Build.findAccount = (buildLogSnapshot) =>
  Rx.Observable
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
    .filter(account => Build.isHpeIntegrationAccount(account));

Build.findService = (buildLogSnapshot) =>
  Rx.Observable
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
