/* eslint-disable new-cap */
import Rx from 'rx';
import { Record } from 'immutable';
import { HpeApiConfig, HpeApiSession, HpeApiBuildSession } from 'cf-hpe-api';
import { Logger } from 'lib/logger';
import { HpeConfig } from 'app/hpe-config';

const logger = Logger.create('BuildSession');
const hpeApiConfig = HpeApiConfig.create(
  HpeConfig.CF_HPE_SERVER_URL,
  HpeConfig.CF_HPE_USER,
  HpeConfig.CF_HPE_PASSWORD,
  HpeConfig.CF_HPE_SHARED_SPACE,
  HpeConfig.CF_HPE_WORKSPACE);

export const BuildSession = Record({
  build: null,
  hpeApiBuildSession: null,
});

BuildSession.createForBuild = (build) =>
  Rx.Observable
    .start(() => logger.info(
      'Open build session. build (%s) service (%s)',
      build.id,
      build.name))
    .flatMap(HpeApiSession.create(hpeApiConfig))
    .flatMap(hpeApiSession => BuildSession.openHpeCiServer(hpeApiSession, build)
      .flatMap(ciServer => BuildSession.openHpePipeline(hpeApiSession, build, ciServer)
        .map(pipeline => HpeApiBuildSession.create(
          hpeApiSession,
          ciServer.id,
          pipeline.id,
          build.id,
          build.name))
        .map(hpeApiBuildSession => new BuildSession({
          build,
          hpeApiBuildSession,
        }))));

BuildSession.reportBuildPipelineStepStatus = (buildSession, buildStep) => {
  return HpeApiBuildSession.reportBuildPipelineStepStatus(
    buildSession.hpeApiBuildSession,
    buildStep.stepId,
    buildStep.startTime,
    buildStep.duration,
    buildStep.status,
    buildStep.result);
};

BuildSession.reportBuildPipelineTestResults = (buildSession, buildStep, testResult) => {
  logger.info('Report build pipeline test result. build (%s) service (%s) test (%s) result (%s)',
    buildSession.build.id,
    buildSession.build.name,
    testResult[0].name,
    testResult[0].status);

  return HpeApiBuildSession.reportBuildPipelineTestResults(
    buildSession.hpeApiBuildSession,
    buildStep.stepId,
    testResult);
};

BuildSession.openHpeCiServer = (session, build) => {
  const id = build.account._id.toString();
  const name = build.account.name;

  return HpeApiSession
    .findCiServer(session, id)
    .flatMap(ciServer => {
      if (ciServer) {
        return Rx.Observable.just(ciServer);
      }

      logger.info('Create hpe ci server. build (%s) name (%s)', build.id, name);
      return HpeApiSession.createCiServer(session, id, name);
    })
    .map(ciServer => ({
      id,
      name,
      hpeId: ciServer.id,
    }));
};

BuildSession.openHpePipeline = (session, build, ciServer) => {
  const id = build.service._id.toString();
  const name = build.service.name;
  const ciServerHpeId = ciServer.hpeId;

  return HpeApiSession
    .createPipeline(session, ciServerHpeId, id, name)
    .catch(error => {
      if (error.statusCode !== 409) {
        return Rx.Observable.throw(error);
      }

      return Rx.Observable.just();
    })
    .map(() => ({
      id,
      name,
      ciServerId: ciServer.id,
    }));
};
