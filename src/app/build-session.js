/* eslint-disable new-cap */
import Rx from 'rx';
import { Record } from 'immutable';
import { HpeApiSession, HpeApiBuildSession } from 'cf-hpe-api';
import { Logger } from 'lib/logger';

const logger = Logger.create('BuildSession');

export const BuildSession = Record({
  build: null,
  hpeApiBuildSession: null,
});

BuildSession.openBuildSession = (build) => {
  return Rx.Observable
    .start(() => logger.info('Open build session. build (%s)', build.id))
    .flatMap(HpeApiSession.create())
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
};

BuildSession.reportStepStatus = (buildSession, buildStep) => {
  return HpeApiBuildSession.reportBuildPipelineStepStatus(
    buildSession.hpeApiBuildSession,
    buildStep.stepId,
    buildStep.startTime,
    buildStep.duration,
    buildStep.status,
    buildStep.result);
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

      logger.info('Create hpe ci server. build (%s)', build.id);
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
