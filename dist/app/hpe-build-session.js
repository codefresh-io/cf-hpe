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

var _cfHpeApi = require('cf-hpe-api');

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
      }).flatMap(_cfHpeApi.HpeApi.connect()).flatMap(function (session) {
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
        ciServerId: buildSession.pipeline.ciServerId,
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

      return _cfHpeApi.HpeApi.reportPipelineStepStatus(buildSession.session, stepStatus);
    }
  }, {
    key: 'openHpeCiServer',
    value: function openHpeCiServer(session, build) {
      var ciServerData = {
        name: build.account.name,
        instanceId: build.account._id.toString()
      };

      return _cfHpeApi.HpeApi.findCiServer(session, ciServerData.instanceId).flatMap(function (ciServer) {
        if (ciServer) {
          return _rx2.default.Observable.just(ciServer);
        }

        logger.info('Create hpe ci server. build (%s)', build.id);
        return _cfHpeApi.HpeApi.createCiServer(session, ciServerData);
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
        ciServerHpeId: ciServer.id
      };

      return _cfHpeApi.HpeApi.createPipeline(session, pipelineData).catch(function (error) {
        if (error.statusCode !== 409) {
          return _rx2.default.Observable.throw(error);
        }

        return _rx2.default.Observable.just();
      }).map(function () {
        return _extends({}, pipelineData, {
          ciServerId: ciServer.instanceId
        });
      });
    }
  }]);

  return HpeBuildSession;
}();
