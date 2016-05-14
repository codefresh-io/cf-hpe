import Rx from 'rx';
import 'firebase-rx';
import HpeApi from 'lib/hpe-api';

function openHpeCiServer(session, account) {
  const ciServerData = {
    name: account.name,
    instanceId: account._id.toString(),
  };

  return HpeApi
    .findCiServer(session, ciServerData.instanceId)
    .flatMap(ciServer => {
      if (ciServer) {
        return Rx.Observable.just(ciServer);
      }
      return HpeApi.createCiServer(session, ciServerData);
    })
    .map(ciServer => {
      return {
        ...ciServerData,
        id: ciServer.id,
      };
    });
}

function openHpePipeline(session, ciServer, service) {
  const pipelineData = {
    id: service._id.toString(),
    name: service.name,
    serverId: ciServer.id,
  };

  return HpeApi
    .createPipeline(session, pipelineData)
    .catch(error => {
      if (error.statusCode !== 409) {
        return Rx.Observable.throw(error);
      }

      return Rx.Observable.just();
    })
    .map(() => {
      return {
        ...pipelineData,
        serverInstanceId: ciServer.instanceId,
      };
    });
}

function mapBuildLogStepToPipelineStep(name) {
  if (name === 'Initializing Process') {
    return 'clone-repository';
  }

  if (name === 'Building Docker Image') {
    return 'build-dockerfile';
  }

  if (name === 'Saving Image to Local Storage') {
    return 'push-docker-registry';
  }

  if (name === 'Running Unit Tests') {
    return 'unit-test-script';
  }
}

class HpeBuildSession {
  constructor(build, session, pipeline) {
    this.build = build;
    this.session = session;
    this.pipeline = pipeline;
  }

  static openSession(build) {
    return HpeApi
      .connect()
      .flatMap(session =>
        openHpeCiServer(session, build.account)
          .flatMap(ciServer => openHpePipeline(session, ciServer, build.service))
          .map(pipeline => new HpeBuildSession(build, session, pipeline)));
  }

  static reportStepStatus(buildSession, buildStep) {
    const stepStatus = {
      stepId: buildStep.stepId,
      serverInstanceId: buildSession.pipeline.serverInstanceId,
      pipelineId: buildSession.pipeline.id,
      buildId: buildSession.build.progressId,
      buildName: buildSession.build.progressId,
      startTime: buildStep.startTime,
      status: buildStep.status,
      result: buildStep.result,
    };

    if (buildStep.duration) {
      stepStatus.duration = buildStep.duration;
    }

    return HpeApi.reportPipelineStepStatus(buildSession.session, stepStatus);
  }
}

export default HpeBuildSession;
