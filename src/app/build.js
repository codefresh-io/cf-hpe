/* eslint-disable new-cap */
import R from 'ramda';
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
  accountId: null,
  accountName: null,
  serviceId: null,
  serviceName: null,
  buildId: null,
  buildName: null,
  startTime: null,
});

const buildNameFromCommit = (commit) =>
  R.takeWhile(R.compose(R.not, R.equals('\n')), commit).join('');

Build.buildsFromFirebase = () =>
  Build
    .openBuildLogsRef()
    .map(buildLogsRef => buildLogsRef
      .orderByChild('data/started')
      .startAt(Date.now() / 1000))
    .flatMap(FirebaseRx.onChildAdded)
    .doOnNext(snapshot => logger.info(
      'New build progress started. progress (%s)',
      snapshot.key()))
    .flatMap(snapshot => Rx.Observable.zip(
      Build.findAccount(snapshot),
      Build.findService(snapshot),
      Build.findBuild(snapshot),
      (account, service, build) => new Build({
        ref: snapshot.ref(),
        accountId: account._id.toString(),
        accountName: account.name,
        serviceId: service._id.toString(),
        serviceName: service.name,
        buildId: build._id.toString(),
        buildName: buildNameFromCommit(build.commit),
        startTime: Date.now(),
      })));

Build.openBuildLogsRef = () =>
  Rx.Observable
    .just(new Firebase(HpeConfig.CF_HPE_FIREBASE_BUILD_LOGS_URL))
    .doOnNext(buildLogsRef => logger.info(
      'Open build logs ref. url (%s)',
      buildLogsRef.toString()))
    .flatMap(FirebaseRx.authWithSecretToken(
      HpeConfig.CF_HPE_FIREBASE_SECRET,
      'hpe-service',
      { admin: true }));

Build.isHpeIntegrationAccount = (account) =>
  true ||
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
        logger.warn(
          'Build progress not found. progress (%s)',
          buildLogSnapshot.key());
        return false;
      }

      return true;
    })
    .flatMap(progress => Model.Service.findOne(
      { _id: Model.toObjectId(progress.get('serviceId')) }))
    .filter(service => {
      if (!service) {
        logger.warn(
          'Build service not found. progress (%s)',
          buildLogSnapshot.key());
        return false;
      }

      return true;
    })
    .map(service => service.toObject());

Build.findBuild = (buildLogSnapshot) =>
  Rx.Observable
    .fromPromise(() => Model.Build.findOne(
      { progress_id: Model.toObjectId(buildLogSnapshot.key()) }))
    .filter(build => {
      if (!build) {
        logger.warn(
          'Build progress not found. progress (%s)',
          buildLogSnapshot.key());
        return false;
      }

      return true;
    })
    .map(build => build.toObject());
