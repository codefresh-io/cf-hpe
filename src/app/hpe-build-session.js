import Rx from 'rx';
import 'firebase-rx';
import HpeApi from 'lib/hpe-api';
import Logger from 'lib/logger';

const logger = Logger.getLogger('build-step');

function openHpeCiServer(session, build) {
  const ciServerData = {
    name: build.account.name,
    instanceId: build.account._id.toString(),
  };

  return HpeApi.findCiServer(session, ciServerData.instanceId)
    .flatMap(ciServer => {
      if (ciServer) {
        return Rx.Observable.just(ciServer);
      }

      logger.info('Create hpe ci server. build (%s)', build.id);
      return HpeApi.createCiServer(session, ciServerData);
    })
    .map(ciServer => ({
      ...ciServerData,
      id: ciServer.id,
    }));
}

function openHpePipeline(session, ciServer, build) {
  const pipelineData = {
    id: build.service._id.toString(),
    name: build.service.name,
    serverId: ciServer.id,
  };

  return HpeApi.createPipeline(session, pipelineData)
    .catch(error => {
      if (error.statusCode !== 409) {
        return Rx.Observable.throw(error);
      }

      return Rx.Observable.just();
    })
    .map(() => ({
      ...pipelineData,
      serverInstanceId: ciServer.instanceId,
    }));
}

class HpeBuildSession {
  constructor(build, session, pipeline) {
    this.build = build;
    this.session = session;
    this.pipeline = pipeline;
  }

  static openSession(build) {
    return Rx.Observable
      .start(() => logger.info('Open hpe build session. build (%s)', build.id))
      .flatMap(HpeApi.connect())
      .flatMap(session =>
        openHpeCiServer(session, build)
          .flatMap(ciServer => openHpePipeline(session, ciServer, build))
          .map(pipeline => new HpeBuildSession(build, session, pipeline)));
  }

  static reportStepStatus(buildSession, buildStep) {
    const stepStatus = {
      stepId: buildStep.stepId,
      serverInstanceId: buildSession.pipeline.serverInstanceId,
      pipelineId: buildSession.pipeline.id,
      buildId: buildSession.build.id,
      buildName: buildSession.build.name,
      startTime: buildStep.startTime * 1000,
      status: buildStep.status,
      result: buildStep.result,
    };

    if (buildStep.duration) {
      stepStatus.duration = buildStep.duration * 1000;
    }

    return HpeApi.reportPipelineStepStatus(buildSession.session, stepStatus);
  }
}

export default HpeBuildSession;