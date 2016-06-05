'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BuildSession = undefined;

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _immutable = require('immutable');

var _cfHpeApi = require('cf-hpe-api');

var _logger = require('../lib/logger');

var _hpeConfig = require('./hpe-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable new-cap */


var logger = _logger.Logger.create('BuildSession');

var hpeApiConfig = _cfHpeApi.HpeApiConfig.create(_hpeConfig.HpeConfig.CF_HPE_SERVER_URL, _hpeConfig.HpeConfig.CF_HPE_USER, _hpeConfig.HpeConfig.CF_HPE_PASSWORD, _hpeConfig.HpeConfig.CF_HPE_SHARED_SPACE, _hpeConfig.HpeConfig.CF_HPE_WORKSPACE);

var BuildSession = exports.BuildSession = (0, _immutable.Record)({
  build: null,
  hpeApiBuildSession: null
});

BuildSession.createForBuild = function (build) {
  return _rx2.default.Observable.just({}).doOnNext(function () {
    return logger.info('Open build session. account (%s) service (%s) build (%s)', build.accountName, build.serviceName, build.buildId);
  }).doOnNext(function () {
    return logger.info('Open hpe session. host (%s) user (%s)', _hpeConfig.HpeConfig.CF_HPE_SERVER_URL, _hpeConfig.HpeConfig.CF_HPE_USER);
  }).flatMap(_cfHpeApi.HpeApiSession.create(hpeApiConfig)).flatMap(function (hpeApiSession) {
    return BuildSession.openHpeCiServer(hpeApiSession, build).flatMap(function (ciServer) {
      return BuildSession.openHpePipeline(hpeApiSession, build, ciServer).map(function (pipeline) {
        return _cfHpeApi.HpeApiBuildSession.create(hpeApiSession, ciServer.id, pipeline.id, build.buildId, build.buildName);
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
  return _rx2.default.Observable.just({}).doOnNext(function () {
    return logger.info('Test result. account (%s) service (%s) build (%s) test (%s) result (%s)', buildSession.build.accountName, buildSession.build.serviceName, buildSession.build.buildId, testResult[0].name, testResult[0].status);
  }).flatMap(function () {
    return _cfHpeApi.HpeApiBuildSession.reportBuildPipelineTestResults(buildSession.hpeApiBuildSession, buildStep.stepId, testResult);
  });
};

BuildSession.openHpeCiServer = function (session, build) {
  var id = build.accountId;
  var name = _util2.default.format('%s-%s', build.accountName, build.accountId);

  return _cfHpeApi.HpeApiSession.findCiServer(session, id).flatMap(function (ciServer) {
    if (ciServer) {
      return _rx2.default.Observable.just(ciServer);
    }

    logger.info('Create hpe ci server. build (%s) id (%s) name (%s)', build.buildId, id, name);
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
  var id = build.serviceId;
  var name = build.serviceName;
  var ciServerHpeId = ciServer.hpeId;

  return _cfHpeApi.HpeApiSession.createPipeline(session, ciServerHpeId, id, name).catch(function (error) {
    if (error.statusCode !== 409) {
      return _rx2.default.Observable.throw(error);
    }

    return _rx2.default.Observable.just({});
  }).map(function () {
    return {
      id: id,
      name: name,
      ciServerId: ciServer.id
    };
  });
};