'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Build = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _immutable = require('immutable');

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _firebaseRx = require('../lib/firebase-rx');

var _logger = require('../lib/logger');

var _model = require('./model');

var _hpeConfig = require('./hpe-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable new-cap */


var logger = _logger.Logger.create('Build');

var Build = exports.Build = (0, _immutable.Record)({
  ref: null,
  accountId: null,
  accountName: null,
  serviceId: null,
  serviceName: null,
  buildId: null,
  buildName: null,
  startTime: null
});

var buildNameFromCommit = function buildNameFromCommit(commit) {
  return _ramda2.default.takeWhile(_ramda2.default.compose(_ramda2.default.not, _ramda2.default.equals('\n')), commit).join('');
};

Build.buildsFromFirebase = function () {
  return Build.openBuildLogsRef().map(function (buildLogsRef) {
    return buildLogsRef.orderByChild('data/started').startAt(Date.now() / 1000);
  }).flatMap(_firebaseRx.FirebaseRx.onChildAdded).doOnNext(function (snapshot) {
    return logger.info('New build detected. progress (%s)', snapshot.key());
  }).flatMap(function (snapshot) {
    return _rx2.default.Observable.zip(Build.findAccount(snapshot), Build.findService(snapshot), Build.findBuild(snapshot), function (account, service, build) {
      return new Build({
        ref: snapshot.ref(),
        accountId: account._id.toString(),
        accountName: account.name,
        serviceId: service._id.toString(),
        serviceName: service.name,
        buildId: build._id.toString(),
        buildName: buildNameFromCommit(build.commit),
        startTime: Date.now()
      });
    });
  }).doOnNext(function (build) {
    return logger.info('New build started. account (%s) service (%s) build (%s)', build.accountName, build.serviceName, build.buildId);
  });
};

Build.openBuildLogsRef = function () {
  return _rx2.default.Observable.just(new _firebase2.default(_hpeConfig.HpeConfig.CF_HPE_FIREBASE_BUILD_LOGS_URL)).doOnNext(function (buildLogsRef) {
    return logger.info('Open build logs ref. url (%s)', buildLogsRef.toString());
  }).flatMap(_firebaseRx.FirebaseRx.authWithSecretToken(_hpeConfig.HpeConfig.CF_HPE_FIREBASE_SECRET, 'hpe-service', { admin: true }));
};

Build.isHpeIntegrationAccount = function (account) {
  return true;
}; // eslint-disable-line no-unused-vars
//  (account.name === HpeConfig.CF_HPE_INTEGRATION_ACCOUNT ||
//  account.integrations.hpe && account.integrations.hpe.active);

Build.findAccount = function (buildLogSnapshot) {
  return _rx2.default.Observable.fromPromise(function () {
    return _model.Model.Account.findOne({ _id: _model.Model.toObjectId(buildLogSnapshot.val().accountId) });
  }).filter(function (account) {
    if (!account) {
      logger.warn('Build account not found. build (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).map(function (account) {
    return account.toObject();
  }).filter(function (account) {
    return Build.isHpeIntegrationAccount(account);
  });
};

Build.findService = function (buildLogSnapshot) {
  return _rx2.default.Observable.fromPromise(function () {
    return _model.Model.Build.findOne({ progress_id: _model.Model.toObjectId(buildLogSnapshot.key()) }, 'serviceId');
  }).filter(function (progress) {
    if (!progress) {
      logger.warn('Build progress not found. progress (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).flatMap(function (progress) {
    return _model.Model.Service.findOne({ _id: _model.Model.toObjectId(progress.get('serviceId')) });
  }).filter(function (service) {
    if (!service) {
      logger.warn('Build service not found. progress (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).map(function (service) {
    return service.toObject();
  });
};

Build.findBuild = function (buildLogSnapshot) {
  return _rx2.default.Observable.fromPromise(function () {
    return _model.Model.Build.findOne({ progress_id: _model.Model.toObjectId(buildLogSnapshot.key()) });
  }).filter(function (build) {
    if (!build) {
      logger.warn('Build progress not found. progress (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).map(function (build) {
    return build.toObject();
  });
};