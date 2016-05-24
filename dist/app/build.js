'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Build = undefined;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _immutable = require('immutable');

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _firebaseRx = require('firebase-rx');

var _logger = require('../lib/logger');

var _model = require('./model');

var _hpeConfig = require('./hpe-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = _logger.Logger.create('Build'); /* eslint-disable new-cap */


var Build = exports.Build = (0, _immutable.Record)({
  ref: null,
  id: null,
  name: null,
  account: null,
  service: null,
  startTime: null
});

Build.buildsFromFirebase = function () {
  return Build.openBuildLogsRef().flatMap(function (buildLogsRef) {
    var query = buildLogsRef.orderByChild('data/started').startAt(Date.now() / 1000);
    return _firebaseRx.FirebaseRx.onChildAdded(query);
  }).flatMap(function (snapshot) {
    logger.info('New build started. build (%s)', snapshot.key());
    return _rx2.default.Observable.zip(Build.findAccount(snapshot), Build.findService(snapshot), function (account, service) {
      return new Build({
        ref: snapshot.ref(),
        id: snapshot.key(),
        name: service.name,
        account: account,
        service: service,
        startTime: Date.now()
      });
    });
  });
};

Build.openBuildLogsRef = function () {
  return _rx2.default.Observable.start(function () {
    return new _firebase2.default(_hpeConfig.HpeConfig.firebaseBuildLogsUrl);
  }).flatMap(function (buildLogs) {
    logger.info('Open build logs ref. url (%s)', buildLogs.toString());
    return _firebaseRx.FirebaseRx.authWithSecretToken(buildLogs, _hpeConfig.HpeConfig.firebaseSecret, 'hpe-service', { admin: true });
  });
};

Build.isHpeIntegrationAccount = function (account) {
  return true || account.integrations.hpe && account.integrations.hpe.active;
};

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
      logger.warn('Build progress not found. build (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).flatMap(function (progress) {
    return _model.Model.Service.findOne({ _id: _model.Model.toObjectId(progress.get('serviceId')) });
  }).filter(function (service) {
    if (!service) {
      logger.warn('Build service not found. build (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).map(function (service) {
    return service.toObject();
  });
};