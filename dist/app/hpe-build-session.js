'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

require('firebase-rx');

var _hpeApi = require('../lib/hpe-api');

var _hpeApi2 = _interopRequireDefault(_hpeApi);

var _logger = require('../lib/logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var logger = _logger2.default.getLogger('build-step');

function openHpeCiServer(session, build) {
  var ciServerData = {
    name: build.account.name,
    instanceId: build.account._id.toString()
  };

  return _hpeApi2.default.findCiServer(session, ciServerData.instanceId).flatMap(function (ciServer) {
    if (ciServer) {
      return _rx2.default.Observable.just(ciServer);
    }

    logger.info('Create hpe ci server. build (%s)', build.id);
    return _hpeApi2.default.createCiServer(session, ciServerData);
  }).map(function (ciServer) {
    return _extends({}, ciServerData, {
      id: ciServer.id
    });
  });
}

function openHpePipeline(session, ciServer, build) {
  var pipelineData = {
    id: build.service._id.toString(),
    name: build.service.name,
    serverId: ciServer.id
  };

  return _hpeApi2.default.createPipeline(session, pipelineData).catch(function (error) {
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

var HpeBuildSession = function () {
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
      }).flatMap(_hpeApi2.default.connect()).flatMap(function (session) {
        return openHpeCiServer(session, build).flatMap(function (ciServer) {
          return openHpePipeline(session, ciServer, build);
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

      return _hpeApi2.default.reportPipelineStepStatus(buildSession.session, stepStatus);
    }
  }]);

  return HpeBuildSession;
}();

exports.default = HpeBuildSession;