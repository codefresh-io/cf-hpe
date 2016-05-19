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

var _logger2 = require('../lib/logger');

var _logger3 = _interopRequireDefault(_logger2);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _logger = _logger3.default.getLogger('build');

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
      return Build._openBuildLogsRef().flatMap(function (buildLogsRef) {
        return buildLogsRef.orderByChild('data/started').startAt(_lodash2.default.now() / 1000).rx_onChildAdded();
      }).flatMap(function (snapshot) {
        _logger.info('Receiving build log. build (%s)', snapshot.key());
        return _rx2.default.Observable.zip(Build._findAccount(snapshot), Build._findService(snapshot), function (account, service) {
          return new Build(snapshot.ref(), snapshot.key(), service.name, account, service);
        });
      });
    }
  }, {
    key: '_openBuildLogsRef',
    value: function _openBuildLogsRef() {
      return _rx2.default.Observable.start(function () {
        return new _firebase2.default(_config2.default.firebaseBuildLogsUrl);
      }).flatMap(function (buildLogs) {
        _logger.info('Open build logs ref. url (%s)', buildLogs.toString());
        return buildLogs.rx_authWithSecretToken(_config2.default.firebaseSecret, 'hpe-service', { admin: true });
      });
    }
  }, {
    key: '_isHpeIntegrationAccount',
    value: function _isHpeIntegrationAccount(account) {
      return true || account.integrations.hpe && account.integrations.hpe.active;
    }
  }, {
    key: '_findAccount',
    value: function _findAccount(buildLogSnapshot) {
      return _rx2.default.Observable.fromPromise(function () {
        return _model2.default.Account.findOne({ _id: _model2.default.ObjectId(buildLogSnapshot.val().accountId) });
      }).filter(function (account) {
        if (!account) {
          _logger.warn('Build account not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      }).map(function (account) {
        return account.toObject();
      }).filter(function (account) {
        return Build._isHpeIntegrationAccount(account);
      });
    }
  }, {
    key: '_findService',
    value: function _findService(buildLogSnapshot) {
      return _rx2.default.Observable.fromPromise(function () {
        return _model2.default.Build.findOne({ progress_id: _model2.default.ObjectId(buildLogSnapshot.key()) }, 'serviceId');
      }).filter(function (progress) {
        if (!progress) {
          _logger.warn('Build progress not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      }).flatMap(function (progress) {
        return _model2.default.Service.findOne({ _id: _model2.default.ObjectId(progress.get('serviceId')) });
      }).filter(function (service) {
        if (!service) {
          _logger.warn('Build service not found. build (%s)', buildLogSnapshot.key());
          return false;
        }

        return true;
      }).map(function (service) {
        return service.toObject();
      });
    }
  }]);

  return Build;
}();

exports.default = Build;
