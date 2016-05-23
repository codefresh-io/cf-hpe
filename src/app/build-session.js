import Rx from 'rx';
import { HpeApi } from 'cf-hpe-api';
import { Logger } from 'lib/logger';

const logger = Logger.create('BuildSession');

export class BuildSession {

  constructor(build, hpeApiBuildSession) {
    this.build = build;
    this.hpeApiBuildSession = hpeApiBuildSession;
  }

  static openBuildSession(build) {
    return Rx.Observable
      .start(() => logger.info('Open build session. build (%s)', build.id))
      .flatMap(HpeApi.createSession())
      .flatMap(hpeApiSession => BuildSession.openHpeCiServer(hpeApiSession, build)
        .flatMap(ciServer => BuildSession.openHpePipeline(hpeApiSession, build, ciServer)
          .map(pipeline => HpeApi.createBuildSession(
            hpeApiSession,
            ciServer.id,
            pipeline.id,
            build.id,
            build.name))
          .map(hpeApiBuildSession => new BuildSession(build, hpeApiBuildSession))));
  }

  static reportStepStatus(buildSession, buildStep) {
    return HpeApi.reportBuildPipelineStepStatus(
      buildSession.hpeApiBuildSession,
      buildStep.stepId,
      buildStep.startTime,
      buildStep.duration,
      buildStep.status,
      buildStep.result);
  }

  static openHpeCiServer(session, build) {
    const id = build.account._id.toString();
    const name = build.account.name;

    return HpeApi
      .findCiServer(session, id)
      .flatMap(ciServer => {
        if (ciServer) {
          return Rx.Observable.just(ciServer);
        }

        logger.info('Create hpe ci server. build (%s)', build.id);
        return HpeApi.createCiServer(session, id, name);
      })
      .map(ciServer => ({
        id,
        name,
        hpeId: ciServer.id,
      }));
  }

  static openHpePipeline(session, build, ciServer) {
    const id = build.service._id.toString();
    const name = build.service.name;
    const ciServerHpeId = ciServer.hpeId;

    return HpeApi
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
  }
}
