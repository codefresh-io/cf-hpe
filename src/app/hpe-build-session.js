import Rx from 'rx';
import 'firebase-rx';
import HpeApi from 'lib/hpe-api';

function openHpeCiServer(session, account) {
  const data = {
    name: account.name,
    instanceId: account._id.toString(),
  };

  return HpeApi
    .findCiServer(session, data.instanceId)
    .flatMap(ciServer => {
      if (ciServer) {
        return Rx.Observable.just(ciServer);
      }
      return HpeApi.createCiServer(session, data);
    })
    .map(ciServer => {
      return {
        ...data,
        id: ciServer.id,
      };
    });
}

function openHpePipeline(session, ciServer, service) {
  const data = {
    id: service._id.toString(),
    name: service.name,
    serverId: ciServer.id,
  };

  return HpeApi
    .createPipeline(session, data)
    .catch(error => {
      if (error.statusCode !== 409) {
        return Rx.Observable.throw(error);
      }

      return Rx.Observable.just();
    })
    .map(() => data);
}

function prepareBuildStepStatusTemplate(buildLog, service, hpeCiServer, hpePipeline) {
  return {
    stepId: null,
    serverInstanceId: hpeCiServer.id,
    pipelineId: hpePipeline.id,
    buildId: buildLog.id,
    buildName: service.name,
    startTime: null,
    duration: null,
    status: null,
    result: null,
  };
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
  constructor(build, session) {
    this.build = build;
    this.session = session;
  }

  static openSession(build) {
    return HpeApi
      .connect()
      .flatMap(session =>
        openHpeCiServer(session, build.account)
          .flatMap(ciServer => openHpePipeline(session, ciServer, build.service))
          .map(pipeline => new HpeBuildSession(build, session, pipeline)));
  }
}

export default HpeBuildSession;
