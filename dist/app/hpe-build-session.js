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

var logger = _logger.Logger.create('HpeBuildSession');

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
    key: 'openHpeCiServer',
    value: function openHpeCiServer(session, build) {
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
    key: 'openHpePipeline',
    value: function openHpePipeline(session, ciServer, build) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC9ocGUtYnVpbGQtc2Vzc2lvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQUlBLElBQU0sU0FBUyxlQUFPLE1BQVAsQ0FBYyxpQkFBZCxDQUFmOztJQUVhLGUsV0FBQSxlO0FBRVgsMkJBQVksS0FBWixFQUFtQixPQUFuQixFQUE0QixRQUE1QixFQUFzQztBQUFBOztBQUNwQyxTQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsU0FBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLFNBQUssUUFBTCxHQUFnQixRQUFoQjtBQUNEOzs7O2dDQUVrQixLLEVBQU87QUFDeEIsYUFBTyxhQUFHLFVBQUgsQ0FDSixLQURJLENBQ0U7QUFBQSxlQUFNLE9BQU8sSUFBUCxDQUFZLG9DQUFaLEVBQWtELE1BQU0sRUFBeEQsQ0FBTjtBQUFBLE9BREYsRUFFSixPQUZJLENBRUksZUFBTyxPQUFQLEVBRkosRUFHSixPQUhJLENBR0k7QUFBQSxlQUNQLGdCQUNHLGVBREgsQ0FDbUIsT0FEbkIsRUFDNEIsS0FENUIsRUFFRyxPQUZILENBRVc7QUFBQSxpQkFBWSxnQkFBZ0IsZUFBaEIsQ0FBZ0MsT0FBaEMsRUFBeUMsUUFBekMsRUFBbUQsS0FBbkQsQ0FBWjtBQUFBLFNBRlgsRUFHRyxHQUhILENBR087QUFBQSxpQkFBWSxJQUFJLGVBQUosQ0FBb0IsS0FBcEIsRUFBMkIsT0FBM0IsRUFBb0MsUUFBcEMsQ0FBWjtBQUFBLFNBSFAsQ0FETztBQUFBLE9BSEosQ0FBUDtBQVFEOzs7cUNBRXVCLFksRUFBYyxTLEVBQVc7QUFDL0MsVUFBTSxhQUFhO0FBQ2pCLGdCQUFRLFVBQVUsTUFERDtBQUVqQiwwQkFBa0IsYUFBYSxRQUFiLENBQXNCLGdCQUZ2QjtBQUdqQixvQkFBWSxhQUFhLFFBQWIsQ0FBc0IsRUFIakI7QUFJakIsaUJBQVMsYUFBYSxLQUFiLENBQW1CLEVBSlg7QUFLakIsbUJBQVcsYUFBYSxLQUFiLENBQW1CLElBTGI7QUFNakIsbUJBQVcsVUFBVSxTQU5KO0FBT2pCLGdCQUFRLFVBQVUsTUFQRDtBQVFqQixnQkFBUSxVQUFVO0FBUkQsT0FBbkI7O0FBV0EsVUFBSSxpQkFBRSxRQUFGLENBQVcsVUFBVSxRQUFyQixDQUFKLEVBQW9DO0FBQ2xDLG1CQUFXLFFBQVgsR0FBc0IsVUFBVSxRQUFoQztBQUNEOztBQUVELGFBQU8sZUFBTyx3QkFBUCxDQUFnQyxhQUFhLE9BQTdDLEVBQXNELFVBQXRELENBQVA7QUFDRDs7O29DQUVzQixPLEVBQVMsSyxFQUFPO0FBQ3JDLFVBQU0sZUFBZTtBQUNuQixjQUFNLE1BQU0sT0FBTixDQUFjLElBREQ7QUFFbkIsb0JBQVksTUFBTSxPQUFOLENBQWMsR0FBZCxDQUFrQixRQUFsQjtBQUZPLE9BQXJCOztBQUtBLGFBQU8sZUFBTyxZQUFQLENBQW9CLE9BQXBCLEVBQTZCLGFBQWEsVUFBMUMsRUFDSixPQURJLENBQ0ksb0JBQVk7QUFDbkIsWUFBSSxRQUFKLEVBQWM7QUFDWixpQkFBTyxhQUFHLFVBQUgsQ0FBYyxJQUFkLENBQW1CLFFBQW5CLENBQVA7QUFDRDs7QUFFRCxlQUFPLElBQVAsQ0FBWSxrQ0FBWixFQUFnRCxNQUFNLEVBQXREO0FBQ0EsZUFBTyxlQUFPLGNBQVAsQ0FBc0IsT0FBdEIsRUFBK0IsWUFBL0IsQ0FBUDtBQUNELE9BUkksRUFTSixHQVRJLENBU0E7QUFBQSw0QkFDQSxZQURBO0FBRUgsY0FBSSxTQUFTO0FBRlY7QUFBQSxPQVRBLENBQVA7QUFhRDs7O29DQUVzQixPLEVBQVMsUSxFQUFVLEssRUFBTztBQUMvQyxVQUFNLGVBQWU7QUFDbkIsWUFBSSxNQUFNLE9BQU4sQ0FBYyxHQUFkLENBQWtCLFFBQWxCLEVBRGU7QUFFbkIsY0FBTSxNQUFNLE9BQU4sQ0FBYyxJQUZEO0FBR25CLGtCQUFVLFNBQVM7QUFIQSxPQUFyQjs7QUFNQSxhQUFPLGVBQU8sY0FBUCxDQUFzQixPQUF0QixFQUErQixZQUEvQixFQUNKLEtBREksQ0FDRSxpQkFBUztBQUNkLFlBQUksTUFBTSxVQUFOLEtBQXFCLEdBQXpCLEVBQThCO0FBQzVCLGlCQUFPLGFBQUcsVUFBSCxDQUFjLEtBQWQsQ0FBb0IsS0FBcEIsQ0FBUDtBQUNEOztBQUVELGVBQU8sYUFBRyxVQUFILENBQWMsSUFBZCxFQUFQO0FBQ0QsT0FQSSxFQVFKLEdBUkksQ0FRQTtBQUFBLDRCQUNBLFlBREE7QUFFSCw0QkFBa0IsU0FBUztBQUZ4QjtBQUFBLE9BUkEsQ0FBUDtBQVlEIiwiZmlsZSI6ImFwcC9ocGUtYnVpbGQtc2Vzc2lvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgUnggZnJvbSAncngnO1xuaW1wb3J0IHsgSHBlQXBpIH0gZnJvbSAnbGliL2hwZS1hcGknO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnbGliL2xvZ2dlcic7XG5cbmNvbnN0IGxvZ2dlciA9IExvZ2dlci5jcmVhdGUoJ0hwZUJ1aWxkU2Vzc2lvbicpO1xuXG5leHBvcnQgY2xhc3MgSHBlQnVpbGRTZXNzaW9uIHtcblxuICBjb25zdHJ1Y3RvcihidWlsZCwgc2Vzc2lvbiwgcGlwZWxpbmUpIHtcbiAgICB0aGlzLmJ1aWxkID0gYnVpbGQ7XG4gICAgdGhpcy5zZXNzaW9uID0gc2Vzc2lvbjtcbiAgICB0aGlzLnBpcGVsaW5lID0gcGlwZWxpbmU7XG4gIH1cblxuICBzdGF0aWMgb3BlblNlc3Npb24oYnVpbGQpIHtcbiAgICByZXR1cm4gUnguT2JzZXJ2YWJsZVxuICAgICAgLnN0YXJ0KCgpID0+IGxvZ2dlci5pbmZvKCdPcGVuIGhwZSBidWlsZCBzZXNzaW9uLiBidWlsZCAoJXMpJywgYnVpbGQuaWQpKVxuICAgICAgLmZsYXRNYXAoSHBlQXBpLmNvbm5lY3QoKSlcbiAgICAgIC5mbGF0TWFwKHNlc3Npb24gPT5cbiAgICAgICAgSHBlQnVpbGRTZXNzaW9uXG4gICAgICAgICAgLm9wZW5IcGVDaVNlcnZlcihzZXNzaW9uLCBidWlsZClcbiAgICAgICAgICAuZmxhdE1hcChjaVNlcnZlciA9PiBIcGVCdWlsZFNlc3Npb24ub3BlbkhwZVBpcGVsaW5lKHNlc3Npb24sIGNpU2VydmVyLCBidWlsZCkpXG4gICAgICAgICAgLm1hcChwaXBlbGluZSA9PiBuZXcgSHBlQnVpbGRTZXNzaW9uKGJ1aWxkLCBzZXNzaW9uLCBwaXBlbGluZSkpKTtcbiAgfVxuXG4gIHN0YXRpYyByZXBvcnRTdGVwU3RhdHVzKGJ1aWxkU2Vzc2lvbiwgYnVpbGRTdGVwKSB7XG4gICAgY29uc3Qgc3RlcFN0YXR1cyA9IHtcbiAgICAgIHN0ZXBJZDogYnVpbGRTdGVwLnN0ZXBJZCxcbiAgICAgIHNlcnZlckluc3RhbmNlSWQ6IGJ1aWxkU2Vzc2lvbi5waXBlbGluZS5zZXJ2ZXJJbnN0YW5jZUlkLFxuICAgICAgcGlwZWxpbmVJZDogYnVpbGRTZXNzaW9uLnBpcGVsaW5lLmlkLFxuICAgICAgYnVpbGRJZDogYnVpbGRTZXNzaW9uLmJ1aWxkLmlkLFxuICAgICAgYnVpbGROYW1lOiBidWlsZFNlc3Npb24uYnVpbGQubmFtZSxcbiAgICAgIHN0YXJ0VGltZTogYnVpbGRTdGVwLnN0YXJ0VGltZSxcbiAgICAgIHN0YXR1czogYnVpbGRTdGVwLnN0YXR1cyxcbiAgICAgIHJlc3VsdDogYnVpbGRTdGVwLnJlc3VsdCxcbiAgICB9O1xuXG4gICAgaWYgKF8uaXNOdW1iZXIoYnVpbGRTdGVwLmR1cmF0aW9uKSkge1xuICAgICAgc3RlcFN0YXR1cy5kdXJhdGlvbiA9IGJ1aWxkU3RlcC5kdXJhdGlvbjtcbiAgICB9XG5cbiAgICByZXR1cm4gSHBlQXBpLnJlcG9ydFBpcGVsaW5lU3RlcFN0YXR1cyhidWlsZFNlc3Npb24uc2Vzc2lvbiwgc3RlcFN0YXR1cyk7XG4gIH1cblxuICBzdGF0aWMgb3BlbkhwZUNpU2VydmVyKHNlc3Npb24sIGJ1aWxkKSB7XG4gICAgY29uc3QgY2lTZXJ2ZXJEYXRhID0ge1xuICAgICAgbmFtZTogYnVpbGQuYWNjb3VudC5uYW1lLFxuICAgICAgaW5zdGFuY2VJZDogYnVpbGQuYWNjb3VudC5faWQudG9TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIEhwZUFwaS5maW5kQ2lTZXJ2ZXIoc2Vzc2lvbiwgY2lTZXJ2ZXJEYXRhLmluc3RhbmNlSWQpXG4gICAgICAuZmxhdE1hcChjaVNlcnZlciA9PiB7XG4gICAgICAgIGlmIChjaVNlcnZlcikge1xuICAgICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3QoY2lTZXJ2ZXIpO1xuICAgICAgICB9XG5cbiAgICAgICAgbG9nZ2VyLmluZm8oJ0NyZWF0ZSBocGUgY2kgc2VydmVyLiBidWlsZCAoJXMpJywgYnVpbGQuaWQpO1xuICAgICAgICByZXR1cm4gSHBlQXBpLmNyZWF0ZUNpU2VydmVyKHNlc3Npb24sIGNpU2VydmVyRGF0YSk7XG4gICAgICB9KVxuICAgICAgLm1hcChjaVNlcnZlciA9PiAoe1xuICAgICAgICAuLi5jaVNlcnZlckRhdGEsXG4gICAgICAgIGlkOiBjaVNlcnZlci5pZCxcbiAgICAgIH0pKTtcbiAgfVxuXG4gIHN0YXRpYyBvcGVuSHBlUGlwZWxpbmUoc2Vzc2lvbiwgY2lTZXJ2ZXIsIGJ1aWxkKSB7XG4gICAgY29uc3QgcGlwZWxpbmVEYXRhID0ge1xuICAgICAgaWQ6IGJ1aWxkLnNlcnZpY2UuX2lkLnRvU3RyaW5nKCksXG4gICAgICBuYW1lOiBidWlsZC5zZXJ2aWNlLm5hbWUsXG4gICAgICBzZXJ2ZXJJZDogY2lTZXJ2ZXIuaWQsXG4gICAgfTtcblxuICAgIHJldHVybiBIcGVBcGkuY3JlYXRlUGlwZWxpbmUoc2Vzc2lvbiwgcGlwZWxpbmVEYXRhKVxuICAgICAgLmNhdGNoKGVycm9yID0+IHtcbiAgICAgICAgaWYgKGVycm9yLnN0YXR1c0NvZGUgIT09IDQwOSkge1xuICAgICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLnRocm93KGVycm9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBSeC5PYnNlcnZhYmxlLmp1c3QoKTtcbiAgICAgIH0pXG4gICAgICAubWFwKCgpID0+ICh7XG4gICAgICAgIC4uLnBpcGVsaW5lRGF0YSxcbiAgICAgICAgc2VydmVySW5zdGFuY2VJZDogY2lTZXJ2ZXIuaW5zdGFuY2VJZCxcbiAgICAgIH0pKTtcbiAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
