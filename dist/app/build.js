'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Build = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _firebase = require('firebase');

var _firebase2 = _interopRequireDefault(_firebase);

var _firebaseRx = require('firebase-rx');

var _logger = require('../lib/logger');

var _model = require('./model');

var _hpeConfig = require('./hpe-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _logger.Logger.getLogger('Build');

var Build = exports.Build = function () {
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
      return Build.openBuildLogsRef().flatMap(function (buildLogsRef) {
        var query = buildLogsRef.orderByChild('data/started').startAt(_lodash2.default.now() / 1000);
        return _firebaseRx.FirebaseRx.onChildAdded(query);
      }).flatMap(function (snapshot) {
        logger.info('New build log. build (%s)', snapshot.key());
        return _rx2.default.Observable.zip(Build.findAccount(snapshot), Build.findService(snapshot), function (account, service) {
          return new Build(snapshot.ref(), snapshot.key(), service.name, account, service);
        });
      });
    }
  }, {
    key: '_openBuildLogsRef',
    value: function _openBuildLogsRef() {
      return _rx2.default.Observable.start(function () {
        return new _firebase2.default(_hpeConfig.HpeConfig.firebaseBuildLogsUrl);
      }).flatMap(function (buildLogs) {
        logger.info('Open build logs ref. url (%s)', buildLogs.toString());
        return _firebaseRx.FirebaseRx.authWithSecretToken(buildLogs, _hpeConfig.HpeConfig.firebaseSecret, 'hpe-service', { admin: true });
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
    }
  }, {
    key: '_findService',
    value: function _findService(buildLogSnapshot) {
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
    }
  }]);

  return Build;
}();
//# sourceMappingURL=data:application/json;base64,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S0FBTixDQUFZLE9BQVosQ0FDakIsRUFBRSxhQUFhLGFBQU0sVUFBTixDQUFpQixpQkFBaUIsR0FBakIsRUFBakIsQ0FBZixFQURpQixFQUVqQixXQUZpQixDQUFOO0FBQUEsT0FEUixFQUlKLE1BSkksQ0FJRyxvQkFBWTtBQUNsQixZQUFJLENBQUMsUUFBTCxFQUFlO0FBQ2IsaUJBQU8sSUFBUCxDQUFZLHNDQUFaLEVBQW9ELGlCQUFpQixHQUFqQixFQUFwRDtBQUNBLGlCQUFPLEtBQVA7QUFDRDs7QUFFRCxlQUFPLElBQVA7QUFDRCxPQVhJLEVBWUosT0FaSSxDQVlJO0FBQUEsZUFBWSxhQUFNLE9BQU4sQ0FBYyxPQUFkLENBQ25CLEVBQUUsS0FBSyxhQUFNLFVBQU4sQ0FBaUIsU0FBUyxHQUFULENBQWEsV0FBYixDQUFqQixDQUFQLEVBRG1CLENBQVo7QUFBQSxPQVpKLEVBY0osTUFkSSxDQWNHLG1CQUFXO0FBQ2pCLFlBQUksQ0FBQyxPQUFMLEVBQWM7QUFDWixpQkFBTyxJQUFQLENBQVkscUNBQVosRUFBbUQsaUJBQWlCLEdBQWpCLEVBQW5EO0FBQ0EsaUJBQU8sS0FBUDtBQUNEOztBQUVELGVBQU8sSUFBUDtBQUNELE9BckJJLEVBc0JKLEdBdEJJLENBc0JBO0FBQUEsZUFBVyxRQUFRLFFBQVIsRUFBWDtBQUFBLE9BdEJBLENBQVA7QUF1QkQiLCJmaWxlIjoiYXBwL2J1aWxkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBSeCBmcm9tICdyeCc7XG5pbXBvcnQgRmlyZWJhc2UgZnJvbSAnZmlyZWJhc2UnO1xuaW1wb3J0IHsgRmlyZWJhc2VSeCB9IGZyb20gJ2ZpcmViYXNlLXJ4JztcbmltcG9ydCB7IExvZ2dlciB9IGZyb20gJ2xpYi9sb2dnZXInO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tICdhcHAvbW9kZWwnO1xuaW1wb3J0IHsgSHBlQ29uZmlnIH0gZnJvbSAnYXBwL2hwZS1jb25maWcnO1xuXG5jb25zdCBsb2dnZXIgPSBMb2dnZXIuZ2V0TG9nZ2VyKCdCdWlsZCcpO1xuXG5leHBvcnQgY2xhc3MgQnVpbGQge1xuXG4gIGNvbnN0cnVjdG9yKHJlZiwgaWQsIG5hbWUsIGFjY291bnQsIHNlcnZpY2UpIHtcbiAgICB0aGlzLnJlZiA9IHJlZjtcbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLmFjY291bnQgPSBhY2NvdW50O1xuICAgIHRoaXMuc2VydmljZSA9IHNlcnZpY2U7XG4gICAgdGhpcy5zdGFydFRpbWUgPSBfLm5vdygpO1xuICB9XG5cbiAgc3RhdGljIGJ1aWxkcygpIHtcbiAgICByZXR1cm4gQnVpbGQuX29wZW5CdWlsZExvZ3NSZWYoKVxuICAgICAgLmZsYXRNYXAoYnVpbGRMb2dzUmVmID0+IHtcbiAgICAgICAgY29uc3QgcXVlcnkgPSBidWlsZExvZ3NSZWZcbiAgICAgICAgICAub3JkZXJCeUNoaWxkKCdkYXRhL3N0YXJ0ZWQnKVxuICAgICAgICAgIC5zdGFydEF0KF8ubm93KCkgLyAxMDAwKTtcbiAgICAgICAgcmV0dXJuIEZpcmViYXNlUngub25DaGlsZEFkZGVkKHF1ZXJ5KTtcbiAgICAgIH0pXG4gICAgICAuZmxhdE1hcChzbmFwc2hvdCA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdOZXcgYnVpbGQgbG9nLiBidWlsZCAoJXMpJywgc25hcHNob3Qua2V5KCkpO1xuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS56aXAoXG4gICAgICAgICAgQnVpbGQuX2ZpbmRBY2NvdW50KHNuYXBzaG90KSxcbiAgICAgICAgICBCdWlsZC5fZmluZFNlcnZpY2Uoc25hcHNob3QpLFxuICAgICAgICAgIChhY2NvdW50LCBzZXJ2aWNlKSA9PiBuZXcgQnVpbGQoXG4gICAgICAgICAgICBzbmFwc2hvdC5yZWYoKSxcbiAgICAgICAgICAgIHNuYXBzaG90LmtleSgpLFxuICAgICAgICAgICAgc2VydmljZS5uYW1lLFxuICAgICAgICAgICAgYWNjb3VudCxcbiAgICAgICAgICAgIHNlcnZpY2UpKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIF9vcGVuQnVpbGRMb2dzUmVmKCkge1xuICAgIHJldHVybiBSeC5PYnNlcnZhYmxlXG4gICAgICAuc3RhcnQoKCkgPT4gbmV3IEZpcmViYXNlKEhwZUNvbmZpZy5maXJlYmFzZUJ1aWxkTG9nc1VybCkpXG4gICAgICAuZmxhdE1hcChidWlsZExvZ3MgPT4ge1xuICAgICAgICBsb2dnZXIuaW5mbygnT3BlbiBidWlsZCBsb2dzIHJlZi4gdXJsICglcyknLCBidWlsZExvZ3MudG9TdHJpbmcoKSk7XG4gICAgICAgIHJldHVybiBGaXJlYmFzZVJ4LmF1dGhXaXRoU2VjcmV0VG9rZW4oXG4gICAgICAgICAgYnVpbGRMb2dzLFxuICAgICAgICAgIEhwZUNvbmZpZy5maXJlYmFzZVNlY3JldCxcbiAgICAgICAgICAnaHBlLXNlcnZpY2UnLFxuICAgICAgICAgIHsgYWRtaW46IHRydWUgfSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBfaXNIcGVJbnRlZ3JhdGlvbkFjY291bnQoYWNjb3VudCkge1xuICAgIHJldHVybiB0cnVlIHx8IGFjY291bnQuaW50ZWdyYXRpb25zLmhwZSAmJiBhY2NvdW50LmludGVncmF0aW9ucy5ocGUuYWN0aXZlO1xuICB9XG5cbiAgc3RhdGljIF9maW5kQWNjb3VudChidWlsZExvZ1NuYXBzaG90KSB7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGVcbiAgICAgIC5mcm9tUHJvbWlzZSgoKSA9PiBNb2RlbC5BY2NvdW50LmZpbmRPbmUoXG4gICAgICAgIHsgX2lkOiBNb2RlbC50b09iamVjdElkKGJ1aWxkTG9nU25hcHNob3QudmFsKCkuYWNjb3VudElkKSB9KSlcbiAgICAgIC5maWx0ZXIoYWNjb3VudCA9PiB7XG4gICAgICAgIGlmICghYWNjb3VudCkge1xuICAgICAgICAgIGxvZ2dlci53YXJuKCdCdWlsZCBhY2NvdW50IG5vdCBmb3VuZC4gYnVpbGQgKCVzKScsIGJ1aWxkTG9nU25hcHNob3Qua2V5KCkpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSlcbiAgICAgIC5tYXAoYWNjb3VudCA9PiBhY2NvdW50LnRvT2JqZWN0KCkpXG4gICAgICAuZmlsdGVyKGFjY291bnQgPT4gQnVpbGQuX2lzSHBlSW50ZWdyYXRpb25BY2NvdW50KGFjY291bnQpKTtcbiAgfVxuXG4gIHN0YXRpYyBfZmluZFNlcnZpY2UoYnVpbGRMb2dTbmFwc2hvdCkge1xuICAgIHJldHVybiBSeC5PYnNlcnZhYmxlXG4gICAgICAuZnJvbVByb21pc2UoKCkgPT4gTW9kZWwuQnVpbGQuZmluZE9uZShcbiAgICAgICAgeyBwcm9ncmVzc19pZDogTW9kZWwudG9PYmplY3RJZChidWlsZExvZ1NuYXBzaG90LmtleSgpKSB9LFxuICAgICAgICAnc2VydmljZUlkJykpXG4gICAgICAuZmlsdGVyKHByb2dyZXNzID0+IHtcbiAgICAgICAgaWYgKCFwcm9ncmVzcykge1xuICAgICAgICAgIGxvZ2dlci53YXJuKCdCdWlsZCBwcm9ncmVzcyBub3QgZm91bmQuIGJ1aWxkICglcyknLCBidWlsZExvZ1NuYXBzaG90LmtleSgpKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pXG4gICAgICAuZmxhdE1hcChwcm9ncmVzcyA9PiBNb2RlbC5TZXJ2aWNlLmZpbmRPbmUoXG4gICAgICAgIHsgX2lkOiBNb2RlbC50b09iamVjdElkKHByb2dyZXNzLmdldCgnc2VydmljZUlkJykpIH0pKVxuICAgICAgLmZpbHRlcihzZXJ2aWNlID0+IHtcbiAgICAgICAgaWYgKCFzZXJ2aWNlKSB7XG4gICAgICAgICAgbG9nZ2VyLndhcm4oJ0J1aWxkIHNlcnZpY2Ugbm90IGZvdW5kLiBidWlsZCAoJXMpJywgYnVpbGRMb2dTbmFwc2hvdC5rZXkoKSk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KVxuICAgICAgLm1hcChzZXJ2aWNlID0+IHNlcnZpY2UudG9PYmplY3QoKSk7XG4gIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
