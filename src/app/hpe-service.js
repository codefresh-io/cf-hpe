import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, Service, Build, objectId } from './model';
import { HpeApi, HpeApiPipeline } from 'lib/hpe-api';

function findAccount(buildLog) {
  return Rx.Observable
    .fromPromise(() => Account.findOne({ _id: objectId(buildLog.accountId) }))
    .map(account => account && account.toObject());
}

function findService(buildLog) {
  return Rx.Observable
    .fromPromise(() => Build.findOne({ progress_id: objectId(buildLog.id) }, 'serviceId'))
    .takeWhile(progress => progress)
    .flatMap(progress => Service.findOne({ _id: objectId(progress.get('serviceId')) }))
    .takeWhile(service => service)
    .map(service => service.toObject())
    .defaultIfEmpty(null);
}

function openHpeSession(account) {
  return HpeApi.connect();
}

function openHpeCiServer(hpeSession, account) {
  const data = {
    instanceId: account._id,
    name: account.name,
  };

  return HpeApi
    .findCiServer(hpeSession, data.instanceId)
    .flapMap(ciServer => Rx.Observable.if(
      () => ciServer,
      Rx.Observable.just(ciServer),
      HpeApi.createCiServer(hpeSession, data)));
}

function openHpePipeline(hpeSession, ciServer, service) {
  const data = {
    id: service._id,
    name: service.name,
    serverId: ciServer.id,
  };

  return HpeApi.createPipeline(hpeSession, data);
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

class RunningBuildStep {
  static getRunningBuildSteps(buildLogRef) {
    const buildLogStepsRef = buildLogRef.child('steps');
    const buildLogObservable = buildLogRef.rx_onceValue().map(snapshot => snapshot.val());
    const accountObservable = buildLogObservable.flatMap(findAccount).shareReplay();
    const serviceObservable = buildLogObservable.flatMap(findService).shareReplay();
    const hpeSessionObservable = accountObservable.flatMap(openHpeSession).shareReplay();

    const hpeCiServerObservable = Rx.Observable
      .zip(hpeSessionObservable, accountObservable, openHpeCiServer)
      .shareReplay();

    const hpePipelineObservable = Rx.Observable
      .zip(hpeSessionObservable, accountObservable, openHpePipeline)
      .shareReplay();


    const buildStepStatusTemplate = Rx.Observable
      .zip(
        buildLogRefObservable,
        serviceObservable,
        hpeCiServerObservable,
        hpePipelineObservable,
        prepareBuildStepStatusTemplate)
      .shareReplay();

    const buildLogStepsEvents = Rx.Observable.merge(
      buildLogStepsRef.rx_onChildAdded(),
      buildLogStepsRef.rx_onChildChanged());

    return buildLogStepsEvents
      .map(snapshot => snapshot.val())
      .mapBuildLogStepToPipelineStep();



  }
}

export default RunningBuildStep;
