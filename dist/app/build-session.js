'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BuildSession = undefined;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _immutable = require('immutable');

var _cfHpeApi = require('cf-hpe-api');

var _logger = require('../lib/logger');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable new-cap */


var logger = _logger.Logger.create('BuildSession');

var BuildSession = exports.BuildSession = (0, _immutable.Record)({
  build: null,
  hpeApiBuildSession: null
});

BuildSession.createForBuild = function (build) {
  return _rx2.default.Observable.start(function () {
    return logger.info('Open build session. build (%s) service (%s)', build.id, build.name);
  }).flatMap(_cfHpeApi.HpeApiSession.create()).flatMap(function (hpeApiSession) {
    return BuildSession.openHpeCiServer(hpeApiSession, build).flatMap(function (ciServer) {
      return BuildSession.openHpePipeline(hpeApiSession, build, ciServer).map(function (pipeline) {
        return _cfHpeApi.HpeApiBuildSession.create(hpeApiSession, ciServer.id, pipeline.id, build.id, build.name);
      }).map(function (hpeApiBuildSession) {
        return new BuildSession({
          build: build,
          hpeApiBuildSession: hpeApiBuildSession
        });
      });
    });
  });
};

BuildSession.reportBuildPipelineStepStatus = function (buildSession, buildStep) {
  return _cfHpeApi.HpeApiBuildSession.reportBuildPipelineStepStatus(buildSession.hpeApiBuildSession, buildStep.stepId, buildStep.startTime, buildStep.duration, buildStep.status, buildStep.result);
};

BuildSession.reportBuildPipelineTestResults = function (buildSession, buildStep, testResult) {
  logger.info('Report build pipeline test result. build (%s) service (%s) test (%s) result (%s)', buildSession.build.id, buildSession.build.name, testResult[0].name, testResult[0].status);

  return _cfHpeApi.HpeApiBuildSession.reportBuildPipelineTestResults(buildSession.hpeApiBuildSession, buildStep.stepId, testResult);
};

BuildSession.openHpeCiServer = function (session, build) {
  var id = build.account._id.toString();
  var name = build.account.name;

  return _cfHpeApi.HpeApiSession.findCiServer(session, id).flatMap(function (ciServer) {
    if (ciServer) {
      return _rx2.default.Observable.just(ciServer);
    }

    logger.info('Create hpe ci server. build (%s) name (%s)', build.id, name);
    return _cfHpeApi.HpeApiSession.createCiServer(session, id, name);
  }).map(function (ciServer) {
    return {
      id: id,
      name: name,
      hpeId: ciServer.id
    };
  });
};

BuildSession.openHpePipeline = function (session, build, ciServer) {
  var id = build.service._id.toString();
  var name = build.service.name;
  var ciServerHpeId = ciServer.hpeId;

  return _cfHpeApi.HpeApiSession.createPipeline(session, ciServerHpeId, id, name).catch(function (error) {
    if (error.statusCode !== 409) {
      return _rx2.default.Observable.throw(error);
    }

    return _rx2.default.Observable.just();
  }).map(function () {
    return {
      id: id,
      name: name,
      ciServerId: ciServer.id
    };
  });
};