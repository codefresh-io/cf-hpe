'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

require('firebase-rx');

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _logger = require('../lib/logger');

var _logger2 = _interopRequireDefault(_logger);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _logger2.default.getLogger('build');

function openBuildLogsRef() {
  return _rx2.default.Observable.start(function () {
    return new _firebase2.default(_config2.default.firebaseBuildLogsUrl);
  }).flatMap(function (buildLogs) {
    logger.info('Open build logs ref. url (%s)', buildLogs.toString());
    return buildLogs.rx_authWithSecretToken(_config2.default.firebaseSecret, 'hpe-service', { admin: true });
  });
}

function isHpeIntegrationAccount(account) {
  return true || account.integrations.hpe && account.integrations.hpe.active;
}

function findAccount(buildLogSnapshot) {
  return _rx2.default.Observable.fromPromise(function () {
    return _model2.default.Account.findOne({ _id: _model2.default.objectId(buildLogSnapshot.val().accountId) });
  }).filter(function (account) {
    if (!account) {
      logger.warn('Build account not found. build (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).map(function (account) {
    return account.toObject();
  }).filter(function (account) {
    return isHpeIntegrationAccount(account);
  });
}

function findService(buildLogSnapshot) {
  return _rx2.default.Observable.fromPromise(function () {
    return _model2.default.Build.findOne({ progress_id: _model2.default.objectId(buildLogSnapshot.key()) }, 'serviceId');
  }).filter(function (progress) {
    if (!progress) {
      logger.warn('Build progress not found. build (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).flatMap(function (progress) {
    return _model2.default.Service.findOne({ _id: _model2.default.objectId(progress.get('serviceId')) });
  }).filter(function (service) {
    if (!service) {
      logger.warn('Build service not found. build (%s)', buildLogSnapshot.key());
      return false;
    }

    return true;
  }).map(function (service) {
    return service.toObject();
  });
}

var Build = function () {
  function Build(ref, id, name, account, service) {
    _classCallCheck(this, Build);

    this.ref = ref;
    this.id = id;
    this.name = name;
    this.account = account;
    this.service = service;
    this.startTime = _lodash2.default.now();
  }

  _createClass(Build, null, [{
    key: 'builds',
    value: function builds() {
      return openBuildLogsRef().flatMap(function (buildLogsRef) {
        return buildLogsRef.orderByChild('data/started').startAt(_lodash2.default.now() / 1000).rx_onChildAdded();
      }).flatMap(function (snapshot) {
        logger.info('Receiving build log. build (%s)', snapshot.key());
        return _rx2.default.Observable.zip(findAccount(snapshot), findService(snapshot), function (account, service) {
          return new Build(snapshot.ref(), snapshot.key(), service.name, account, service);
        });
      });
    }
  }]);

  return Build;
}();

exports.default = Build;