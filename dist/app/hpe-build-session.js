'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpeBuildSession = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _hpeApi = require('../lib/hpe-api');

var _logger = require('../lib/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _logger.Logger.getLogger('HpeBuildSession');

var HpeBuildSession = exports.HpeBuildSession = function () {
  function HpeBuildSession(build, session, pipeline) {
    _classCallCheck(this, HpeBuildSession);

    this.build = build;
    this.session = session;
    this.pipeline = pipeline;
  }

  _createClass(HpeBuildSession, null, [{
    key: 'openSession',
    value: function openSession(build) {
      return _rx2.default.Observable.start(function () {
        return logger.info('Open hpe build session. build (%s)', build.id);
      }).flatMap(_hpeApi.HpeApi.connect()).flatMap(function (session) {
        return HpeBuildSession.openHpeCiServer(session, build).flatMap(function (ciServer) {
          return HpeBuildSession.openHpePipeline(session, ciServer, build);
        }).map(function (pipeline) {
          return new HpeBuildSession(build, session, pipeline);
        });
      });
    }
  }, {
    key: 'reportStepStatus',
    value: function reportStepStatus(buildSession, buildStep) {
      var stepStatus = {
        stepId: buildStep.stepId,
        serverInstanceId: buildSession.pipeline.serverInstanceId,
        pipelineId: buildSession.pipeline.id,
        buildId: buildSession.build.id,
        buildName: buildSession.build.name,
        startTime: buildStep.startTime,
        status: buildStep.status,
        result: buildStep.result
      };

      if (_lodash2.default.isNumber(buildStep.duration)) {
        stepStatus.duration = buildStep.duration;
      }

      return _hpeApi.HpeApi.reportPipelineStepStatus(buildSession.session, stepStatus);
    }
  }, {
    key: '_openHpeCiServer',
    value: function _openHpeCiServer(session, build) {
      var ciServerData = {
        name: build.account.name,
        instanceId: build.account._id.toString()
      };

      return _hpeApi.HpeApi.findCiServer(session, ciServerData.instanceId).flatMap(function (ciServer) {
        if (ciServer) {
          return _rx2.default.Observable.just(ciServer);
        }

        logger.info('Create hpe ci server. build (%s)', build.id);
        return _hpeApi.HpeApi.createCiServer(session, ciServerData);
      }).map(function (ciServer) {
        return _extends({}, ciServerData, {
          id: ciServer.id
        });
      });
    }
  }, {
    key: '_openHpePipeline',
    value: function _openHpePipeline(session, ciServer, build) {
      var pipelineData = {
        id: build.service._id.toString(),
        name: build.service.name,
        serverId: ciServer.id
      };

      return _hpeApi.HpeApi.createPipeline(session, pipelineData).catch(function (error) {
        if (error.statusCode !== 409) {
          return _rx2.default.Observable.throw(error);
        }

        return _rx2.default.Observable.just();
      }).map(function () {
        return _extends({}, pipelineData, {
          serverInstanceId: ciServer.instanceId
        });
      });
    }
  }]);

  return HpeBuildSession;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC9ocGUtYnVpbGQtc2Vzc2lvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sU0FBUyxlQUFPLFNBQVAsQ0FBaUIsaUJBQWpCLENBQWY7O0lBRWEsZSxXQUFBLGU7QUFDWCwyQkFBWSxLQUFaLEVBQW1CLE9BQW5CLEVBQTRCLFFBQTVCLEVBQXNDO0FBQUE7O0FBQ3BDLFNBQUssS0FBTCxHQUFhLEtBQWI7QUFDQSxTQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0Q7Ozs7Z0NBRWtCLEssRUFBTztBQUN4QixhQUFPLGFBQUcsVUFBSCxDQUNKLEtBREksQ0FDRTtBQUFBLGVBQU0sT0FBTyxJQUFQLENBQVksb0NBQVosRUFBa0QsTUFBTSxFQUF4RCxDQUFOO0FBQUEsT0FERixFQUVKLE9BRkksQ0FFSSxlQUFPLE9BQVAsRUFGSixFQUdKLE9BSEksQ0FHSTtBQUFBLGVBQ1AsZ0JBQWdCLGdCQUFoQixDQUFpQyxPQUFqQyxFQUEwQyxLQUExQyxFQUNHLE9BREgsQ0FDVztBQUFBLGlCQUFZLGdCQUFnQixnQkFBaEIsQ0FBaUMsT0FBakMsRUFBMEMsUUFBMUMsRUFBb0QsS0FBcEQsQ0FBWjtBQUFBLFNBRFgsRUFFRyxHQUZILENBRU87QUFBQSxpQkFBWSxJQUFJLGVBQUosQ0FBb0IsS0FBcEIsRUFBMkIsT0FBM0IsRUFBb0MsUUFBcEMsQ0FBWjtBQUFBLFNBRlAsQ0FETztBQUFBLE9BSEosQ0FBUDtBQU9EOzs7cUNBRXVCLFksRUFBYyxTLEVBQVc7QUFDL0MsVUFBTSxhQUFhO0FBQ2pCLGdCQUFRLFVBQVUsTUFERDtBQUVqQiwwQkFBa0IsYUFBYSxRQUFiLENBQXNCLGdCQUZ2QjtBQUdqQixvQkFBWSxhQUFhLFFBQWIsQ0FBc0IsRUFIakI7QUFJakIsaUJBQVMsYUFBYSxLQUFiLENBQW1CLEVBSlg7QUFLakIsbUJBQVcsYUFBYSxLQUFiLENBQW1CLElBTGI7QUFNakIsbUJBQVcsVUFBVSxTQU5KO0FBT2pCLGdCQUFRLFVBQVUsTUFQRDtBQVFqQixnQkFBUSxVQUFVO0FBUkQsT0FBbkI7O0FBV0EsVUFBSSxpQkFBRSxRQUFGLENBQVcsVUFBVSxRQUFyQixDQUFKLEVBQW9DO0FBQ2xDLG1CQUFXLFFBQVgsR0FBc0IsVUFBVSxRQUFoQztBQUNEOztBQUVELGFBQU8sZUFBTyx3QkFBUCxDQUFnQyxhQUFhLE9BQTdDLEVBQXNELFVBQXRELENBQVA7QUFDRDs7O3FDQUV1QixPLEVBQVMsSyxFQUFPO0FBQ3RDLFVBQU0sZUFBZTtBQUNuQixjQUFNLE1BQU0sT0FBTixDQUFjLElBREQ7QUFFbkIsb0JBQVksTUFBTSxPQUFOLENBQWMsR0FBZCxDQUFrQixRQUFsQjtBQUZPLE9BQXJCOztBQUtBLGFBQU8sZUFBTyxZQUFQLENBQW9CLE9BQXBCLEVBQTZCLGFBQWEsVUFBMUMsRUFDSixPQURJLENBQ0ksb0JBQVk7QUFDbkIsWUFBSSxRQUFKLEVBQWM7QUFDWixpQkFBTyxhQUFHLFVBQUgsQ0FBYyxJQUFkLENBQW1CLFFBQW5CLENBQVA7QUFDRDs7QUFFRCxlQUFPLElBQVAsQ0FBWSxrQ0FBWixFQUFnRCxNQUFNLEVBQXREO0FBQ0EsZUFBTyxlQUFPLGNBQVAsQ0FBc0IsT0FBdEIsRUFBK0IsWUFBL0IsQ0FBUDtBQUNELE9BUkksRUFTSixHQVRJLENBU0E7QUFBQSw0QkFDQSxZQURBO0FBRUgsY0FBSSxTQUFTO0FBRlY7QUFBQSxPQVRBLENBQVA7QUFhRDs7O3FDQUV1QixPLEVBQVMsUSxFQUFVLEssRUFBTztBQUNoRCxVQUFNLGVBQWU7QUFDbkIsWUFBSSxNQUFNLE9BQU4sQ0FBYyxHQUFkLENBQWtCLFFBQWxCLEVBRGU7QUFFbkIsY0FBTSxNQUFNLE9BQU4sQ0FBYyxJQUZEO0FBR25CLGtCQUFVLFNBQVM7QUFIQSxPQUFyQjs7QUFNQSxhQUFPLGVBQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUNKLEtBREksQ0FDRSxpQkFBUztBQUNkLFlBQUksTUFBTSxVQUFOLEtBQXFCLEdBQXpCLEVBQThCO0FBQzVCLGlCQUFPLGFBQUcsVUFBSCxDQUFjLEtBQWQsQ0FBb0IsS0FBcEIsQ0FBUDtBQUNEOztBQUVELGVBQU8sYUFBRyxVQUFILENBQWMsSUFBZCxFQUFQO0FBQ0QsT0FQSSxFQVFKLEdBUkksQ0FRQTtBQUFBLDRCQUNBLFlBREE7QUFFSCw0QkFBa0IsU0FBUztBQUZ4QjtBQUFBLE9BUkEsQ0FBUDtBQVlEIiwiZmlsZSI6ImFwcC9ocGUtYnVpbGQtc2Vzc2lvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgUnggZnJvbSAncngnO1xuaW1wb3J0IHsgSHBlQXBpIH0gZnJvbSAnbGliL2hwZS1hcGknO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnbGliL2xvZ2dlcic7XG5cbmNvbnN0IGxvZ2dlciA9IExvZ2dlci5nZXRMb2dnZXIoJ0hwZUJ1aWxkU2Vzc2lvbicpO1xuXG5leHBvcnQgY2xhc3MgSHBlQnVpbGRTZXNzaW9uIHtcbiAgY29uc3RydWN0b3IoYnVpbGQsIHNlc3Npb24sIHBpcGVsaW5lKSB7XG4gICAgdGhpcy5idWlsZCA9IGJ1aWxkO1xuICAgIHRoaXMuc2Vzc2lvbiA9IHNlc3Npb247XG4gICAgdGhpcy5waXBlbGluZSA9IHBpcGVsaW5lO1xuICB9XG5cbiAgc3RhdGljIG9wZW5TZXNzaW9uKGJ1aWxkKSB7XG4gICAgcmV0dXJuIFJ4Lk9ic2VydmFibGVcbiAgICAgIC5zdGFydCgoKSA9PiBsb2dnZXIuaW5mbygnT3BlbiBocGUgYnVpbGQgc2Vzc2lvbi4gYnVpbGQgKCVzKScsIGJ1aWxkLmlkKSlcbiAgICAgIC5mbGF0TWFwKEhwZUFwaS5jb25uZWN0KCkpXG4gICAgICAuZmxhdE1hcChzZXNzaW9uID0+XG4gICAgICAgIEhwZUJ1aWxkU2Vzc2lvbi5fb3BlbkhwZUNpU2VydmVyKHNlc3Npb24sIGJ1aWxkKVxuICAgICAgICAgIC5mbGF0TWFwKGNpU2VydmVyID0+IEhwZUJ1aWxkU2Vzc2lvbi5fb3BlbkhwZVBpcGVsaW5lKHNlc3Npb24sIGNpU2VydmVyLCBidWlsZCkpXG4gICAgICAgICAgLm1hcChwaXBlbGluZSA9PiBuZXcgSHBlQnVpbGRTZXNzaW9uKGJ1aWxkLCBzZXNzaW9uLCBwaXBlbGluZSkpKTtcbiAgfVxuXG4gIHN0YXRpYyByZXBvcnRTdGVwU3RhdHVzKGJ1aWxkU2Vzc2lvbiwgYnVpbGRTdGVwKSB7XG4gICAgY29uc3Qgc3RlcFN0YXR1cyA9IHtcbiAgICAgIHN0ZXBJZDogYnVpbGRTdGVwLnN0ZXBJZCxcbiAgICAgIHNlcnZlckluc3RhbmNlSWQ6IGJ1aWxkU2Vzc2lvbi5waXBlbGluZS5zZXJ2ZXJJbnN0YW5jZUlkLFxuICAgICAgcGlwZWxpbmVJZDogYnVpbGRTZXNzaW9uLnBpcGVsaW5lLmlkLFxuICAgICAgYnVpbGRJZDogYnVpbGRTZXNzaW9uLmJ1aWxkLmlkLFxuICAgICAgYnVpbGROYW1lOiBidWlsZFNlc3Npb24uYnVpbGQubmFtZSxcbiAgICAgIHN0YXJ0VGltZTogYnVpbGRTdGVwLnN0YXJ0VGltZSxcbiAgICAgIHN0YXR1czogYnVpbGRTdGVwLnN0YXR1cyxcbiAgICAgIHJlc3VsdDogYnVpbGRTdGVwLnJlc3VsdCxcbiAgICB9O1xuXG4gICAgaWYgKF8uaXNOdW1iZXIoYnVpbGRTdGVwLmR1cmF0aW9uKSkge1xuICAgICAgc3RlcFN0YXR1cy5kdXJhdGlvbiA9IGJ1aWxkU3RlcC5kdXJhdGlvbjtcbiAgICB9XG5cbiAgICByZXR1cm4gSHBlQXBpLnJlcG9ydFBpcGVsaW5lU3RlcFN0YXR1cyhidWlsZFNlc3Npb24uc2Vzc2lvbiwgc3RlcFN0YXR1cyk7XG4gIH1cblxuICBzdGF0aWMgX29wZW5IcGVDaVNlcnZlcihzZXNzaW9uLCBidWlsZCkge1xuICAgIGNvbnN0IGNpU2VydmVyRGF0YSA9IHtcbiAgICAgIG5hbWU6IGJ1aWxkLmFjY291bnQubmFtZSxcbiAgICAgIGluc3RhbmNlSWQ6IGJ1aWxkLmFjY291bnQuX2lkLnRvU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHJldHVybiBIcGVBcGkuZmluZENpU2VydmVyKHNlc3Npb24sIGNpU2VydmVyRGF0YS5pbnN0YW5jZUlkKVxuICAgICAgLmZsYXRNYXAoY2lTZXJ2ZXIgPT4ge1xuICAgICAgICBpZiAoY2lTZXJ2ZXIpIHtcbiAgICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZS5qdXN0KGNpU2VydmVyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxvZ2dlci5pbmZvKCdDcmVhdGUgaHBlIGNpIHNlcnZlci4gYnVpbGQgKCVzKScsIGJ1aWxkLmlkKTtcbiAgICAgICAgcmV0dXJuIEhwZUFwaS5jcmVhdGVDaVNlcnZlcihzZXNzaW9uLCBjaVNlcnZlckRhdGEpO1xuICAgICAgfSlcbiAgICAgIC5tYXAoY2lTZXJ2ZXIgPT4gKHtcbiAgICAgICAgLi4uY2lTZXJ2ZXJEYXRhLFxuICAgICAgICBpZDogY2lTZXJ2ZXIuaWQsXG4gICAgICB9KSk7XG4gIH1cblxuICBzdGF0aWMgX29wZW5IcGVQaXBlbGluZShzZXNzaW9uLCBjaVNlcnZlciwgYnVpbGQpIHtcbiAgICBjb25zdCBwaXBlbGluZURhdGEgPSB7XG4gICAgICBpZDogYnVpbGQuc2VydmljZS5faWQudG9TdHJpbmcoKSxcbiAgICAgIG5hbWU6IGJ1aWxkLnNlcnZpY2UubmFtZSxcbiAgICAgIHNlcnZlcklkOiBjaVNlcnZlci5pZCxcbiAgICB9O1xuXG4gICAgcmV0dXJuIEhwZUFwaS5jcmVhdGVQaXBlbGluZShzZXNzaW9uLCBwaXBlbGluZURhdGEpXG4gICAgICAuY2F0Y2goZXJyb3IgPT4ge1xuICAgICAgICBpZiAoZXJyb3Iuc3RhdHVzQ29kZSAhPT0gNDA5KSB7XG4gICAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUudGhyb3coZXJyb3IpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFJ4Lk9ic2VydmFibGUuanVzdCgpO1xuICAgICAgfSlcbiAgICAgIC5tYXAoKCkgPT4gKHtcbiAgICAgICAgLi4ucGlwZWxpbmVEYXRhLFxuICAgICAgICBzZXJ2ZXJJbnN0YW5jZUlkOiBjaVNlcnZlci5pbnN0YW5jZUlkLFxuICAgICAgfSkpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
