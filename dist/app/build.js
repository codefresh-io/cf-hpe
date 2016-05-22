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

var logger = _logger.Logger.create('Build');

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
    key: 'openBuildLogsRef',
    value: function openBuildLogsRef() {
      return _rx2.default.Observable.start(function () {
        return new _firebase2.default(_hpeConfig.HpeConfig.firebaseBuildLogsUrl);
      }).flatMap(function (buildLogs) {
        logger.info('Open build logs ref. url (%s)', buildLogs.toString());
        return _firebaseRx.FirebaseRx.authWithSecretToken(buildLogs, _hpeConfig.HpeConfig.firebaseSecret, 'hpe-service', { admin: true });
      });
    }
  }, {
    key: 'isHpeIntegrationAccount',
    value: function isHpeIntegrationAccount(account) {
      return true || account.integrations.hpe && account.integrations.hpe.active;
    }
  }, {
    key: 'findAccount',
    value: function findAccount(buildLogSnapshot) {
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
    key: 'findService',
    value: function findService(buildLogSnapshot) {
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
//# sourceMappingURL=data:application/json;base64,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QU4sQ0FBWSxPQUFaLENBQ2pCLEVBQUUsYUFBYSxhQUFNLFVBQU4sQ0FBaUIsaUJBQWlCLEdBQWpCLEVBQWpCLENBQWYsRUFEaUIsRUFFakIsV0FGaUIsQ0FBTjtBQUFBLE9BRFIsRUFJSixNQUpJLENBSUcsb0JBQVk7QUFDbEIsWUFBSSxDQUFDLFFBQUwsRUFBZTtBQUNiLGlCQUFPLElBQVAsQ0FBWSxzQ0FBWixFQUFvRCxpQkFBaUIsR0FBakIsRUFBcEQ7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7O0FBRUQsZUFBTyxJQUFQO0FBQ0QsT0FYSSxFQVlKLE9BWkksQ0FZSTtBQUFBLGVBQVksYUFBTSxPQUFOLENBQWMsT0FBZCxDQUNuQixFQUFFLEtBQUssYUFBTSxVQUFOLENBQWlCLFNBQVMsR0FBVCxDQUFhLFdBQWIsQ0FBakIsQ0FBUCxFQURtQixDQUFaO0FBQUEsT0FaSixFQWNKLE1BZEksQ0FjRyxtQkFBVztBQUNqQixZQUFJLENBQUMsT0FBTCxFQUFjO0FBQ1osaUJBQU8sSUFBUCxDQUFZLHFDQUFaLEVBQW1ELGlCQUFpQixHQUFqQixFQUFuRDtBQUNBLGlCQUFPLEtBQVA7QUFDRDs7QUFFRCxlQUFPLElBQVA7QUFDRCxPQXJCSSxFQXNCSixHQXRCSSxDQXNCQTtBQUFBLGVBQVcsUUFBUSxRQUFSLEVBQVg7QUFBQSxPQXRCQSxDQUFQO0FBdUJEIiwiZmlsZSI6ImFwcC9idWlsZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgUnggZnJvbSAncngnO1xuaW1wb3J0IEZpcmViYXNlIGZyb20gJ2ZpcmViYXNlJztcbmltcG9ydCB7IEZpcmViYXNlUnggfSBmcm9tICdmaXJlYmFzZS1yeCc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICdsaWIvbG9nZ2VyJztcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSAnYXBwL21vZGVsJztcbmltcG9ydCB7IEhwZUNvbmZpZyB9IGZyb20gJ2FwcC9ocGUtY29uZmlnJztcblxuY29uc3QgbG9nZ2VyID0gTG9nZ2VyLmNyZWF0ZSgnQnVpbGQnKTtcblxuZXhwb3J0IGNsYXNzIEJ1aWxkIHtcblxuICBjb25zdHJ1Y3RvcihyZWYsIGlkLCBuYW1lLCBhY2NvdW50LCBzZXJ2aWNlKSB7XG4gICAgdGhpcy5yZWYgPSByZWY7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5hY2NvdW50ID0gYWNjb3VudDtcbiAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gXy5ub3coKTtcbiAgfVxuXG4gIHN0YXRpYyBidWlsZHMoKSB7XG4gICAgcmV0dXJuIEJ1aWxkXG4gICAgICAub3BlbkJ1aWxkTG9nc1JlZigpXG4gICAgICAuZmxhdE1hcChidWlsZExvZ3NSZWYgPT4ge1xuICAgICAgICBjb25zdCBxdWVyeSA9IGJ1aWxkTG9nc1JlZlxuICAgICAgICAgIC5vcmRlckJ5Q2hpbGQoJ2RhdGEvc3RhcnRlZCcpXG4gICAgICAgICAgLnN0YXJ0QXQoXy5ub3coKSAvIDEwMDApO1xuICAgICAgICByZXR1cm4gRmlyZWJhc2VSeC5vbkNoaWxkQWRkZWQocXVlcnkpO1xuICAgICAgfSlcbiAgICAgIC5mbGF0TWFwKHNuYXBzaG90ID0+IHtcbiAgICAgICAgbG9nZ2VyLmluZm8oJ05ldyBidWlsZCBsb2cuIGJ1aWxkICglcyknLCBzbmFwc2hvdC5rZXkoKSk7XG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLnppcChcbiAgICAgICAgICBCdWlsZC5maW5kQWNjb3VudChzbmFwc2hvdCksXG4gICAgICAgICAgQnVpbGQuZmluZFNlcnZpY2Uoc25hcHNob3QpLFxuICAgICAgICAgIChhY2NvdW50LCBzZXJ2aWNlKSA9PiBuZXcgQnVpbGQoXG4gICAgICAgICAgICBzbmFwc2hvdC5yZWYoKSxcbiAgICAgICAgICAgIHNuYXBzaG90LmtleSgpLFxuICAgICAgICAgICAgc2VydmljZS5uYW1lLFxuICAgICAgICAgICAgYWNjb3VudCxcbiAgICAgICAgICAgIHNlcnZpY2UpKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG9wZW5CdWlsZExvZ3NSZWYoKSB7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGVcbiAgICAgIC5zdGFydCgoKSA9PiBuZXcgRmlyZWJhc2UoSHBlQ29uZmlnLmZpcmViYXNlQnVpbGRMb2dzVXJsKSlcbiAgICAgIC5mbGF0TWFwKGJ1aWxkTG9ncyA9PiB7XG4gICAgICAgIGxvZ2dlci5pbmZvKCdPcGVuIGJ1aWxkIGxvZ3MgcmVmLiB1cmwgKCVzKScsIGJ1aWxkTG9ncy50b1N0cmluZygpKTtcbiAgICAgICAgcmV0dXJuIEZpcmViYXNlUnguYXV0aFdpdGhTZWNyZXRUb2tlbihcbiAgICAgICAgICBidWlsZExvZ3MsXG4gICAgICAgICAgSHBlQ29uZmlnLmZpcmViYXNlU2VjcmV0LFxuICAgICAgICAgICdocGUtc2VydmljZScsXG4gICAgICAgICAgeyBhZG1pbjogdHJ1ZSB9KTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGlzSHBlSW50ZWdyYXRpb25BY2NvdW50KGFjY291bnQpIHtcbiAgICByZXR1cm4gdHJ1ZSB8fCBhY2NvdW50LmludGVncmF0aW9ucy5ocGUgJiYgYWNjb3VudC5pbnRlZ3JhdGlvbnMuaHBlLmFjdGl2ZTtcbiAgfVxuXG4gIHN0YXRpYyBmaW5kQWNjb3VudChidWlsZExvZ1NuYXBzaG90KSB7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGVcbiAgICAgIC5mcm9tUHJvbWlzZSgoKSA9PiBNb2RlbC5BY2NvdW50LmZpbmRPbmUoXG4gICAgICAgIHsgX2lkOiBNb2RlbC50b09iamVjdElkKGJ1aWxkTG9nU25hcHNob3QudmFsKCkuYWNjb3VudElkKSB9KSlcbiAgICAgIC5maWx0ZXIoYWNjb3VudCA9PiB7XG4gICAgICAgIGlmICghYWNjb3VudCkge1xuICAgICAgICAgIGxvZ2dlci53YXJuKCdCdWlsZCBhY2NvdW50IG5vdCBmb3VuZC4gYnVpbGQgKCVzKScsIGJ1aWxkTG9nU25hcHNob3Qua2V5KCkpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSlcbiAgICAgIC5tYXAoYWNjb3VudCA9PiBhY2NvdW50LnRvT2JqZWN0KCkpXG4gICAgICAuZmlsdGVyKGFjY291bnQgPT4gQnVpbGQuaXNIcGVJbnRlZ3JhdGlvbkFjY291bnQoYWNjb3VudCkpO1xuICB9XG5cbiAgc3RhdGljIGZpbmRTZXJ2aWNlKGJ1aWxkTG9nU25hcHNob3QpIHtcbiAgICByZXR1cm4gUnguT2JzZXJ2YWJsZVxuICAgICAgLmZyb21Qcm9taXNlKCgpID0+IE1vZGVsLkJ1aWxkLmZpbmRPbmUoXG4gICAgICAgIHsgcHJvZ3Jlc3NfaWQ6IE1vZGVsLnRvT2JqZWN0SWQoYnVpbGRMb2dTbmFwc2hvdC5rZXkoKSkgfSxcbiAgICAgICAgJ3NlcnZpY2VJZCcpKVxuICAgICAgLmZpbHRlcihwcm9ncmVzcyA9PiB7XG4gICAgICAgIGlmICghcHJvZ3Jlc3MpIHtcbiAgICAgICAgICBsb2dnZXIud2FybignQnVpbGQgcHJvZ3Jlc3Mgbm90IGZvdW5kLiBidWlsZCAoJXMpJywgYnVpbGRMb2dTbmFwc2hvdC5rZXkoKSk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KVxuICAgICAgLmZsYXRNYXAocHJvZ3Jlc3MgPT4gTW9kZWwuU2VydmljZS5maW5kT25lKFxuICAgICAgICB7IF9pZDogTW9kZWwudG9PYmplY3RJZChwcm9ncmVzcy5nZXQoJ3NlcnZpY2VJZCcpKSB9KSlcbiAgICAgIC5maWx0ZXIoc2VydmljZSA9PiB7XG4gICAgICAgIGlmICghc2VydmljZSkge1xuICAgICAgICAgIGxvZ2dlci53YXJuKCdCdWlsZCBzZXJ2aWNlIG5vdCBmb3VuZC4gYnVpbGQgKCVzKScsIGJ1aWxkTG9nU25hcHNob3Qua2V5KCkpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSlcbiAgICAgIC5tYXAoc2VydmljZSA9PiBzZXJ2aWNlLnRvT2JqZWN0KCkpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
