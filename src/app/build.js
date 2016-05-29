/* eslint-disable new-cap */
import Rx from 'rx';
import { Record } from 'immutable';
import Firebase from 'firebase';
import { FirebaseRx } from 'lib/firebase-rx';
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
    .map(buildLogsRef => buildLogsRef
      .orderByChild('data/started')
      .startAt(Date.now() / 1000))
    .flatMap(FirebaseRx.onChildAdded)
    .doOnNext(snapshot => logger.info('New build started. build (%s)', snapshot.key()))
    .flatMap(snapshot => Rx.Observable.zip(
      Build.findAccount(snapshot),
      Build.findService(snapshot),
      (account, service) => new Build({
        ref: snapshot.ref(),
        id: snapshot.key(),
        name: service.name,
        account,
        service,
        startTime: Date.now(),
      })));

Build.openBuildLogsRef = () =>
  Rx.Observable
    .start(() => new Firebase(HpeConfig.CF_HPE_FIREBASE_BUILD_LOGS_URL))
    .doOnNext(buildLogsRef => logger.info(
      'Open build logs ref. url (%s)',
      buildLogsRef.toString()))
    .flatMap(FirebaseRx.authWithSecretToken(
      HpeConfig.CF_HPE_FIREBASE_SECRET,
      'hpe-service',
      { admin: true }));

Build.isHpeIntegrationAccount = (account) =>
  (account.name === HpeConfig.CF_HPE_INTEGRATION_ACCOUNT ||
  account.integrations.hpe && account.integrations.hpe.active);

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
