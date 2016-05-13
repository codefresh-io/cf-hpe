import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, Service, Build, objectId } from './model';
import { HpeApi, HpeApiPipeline } from 'lib/hpe-api';
import _config from './config';

function findAccount(buildLogRef) {
  return buildLogRef
    .rx_onceValue().map(snapshot => snapshot.val())
    .flatMap(buildLog => Rx.Observable
      .fromPromise(() => Account.findOne({ _id: objectId(buildLog.accountId) }))
      .map(account => account && account.toObject()));
}

function findService(buildLogRef) {
  return buildLogRef
    .rx_onceValue().map(snapshot => snapshot.val())
    .flatMap(buildLog => Rx.Observable
      .fromPromise(() => Build.findOne({ progress_id: objectId(buildLog.id) }, 'serviceId'))
      .takeWhile(progress => progress)
      .flatMap(progress => Service.findOne({ _id: objectId(progress.get('serviceId')) }))
      .takeWhile(service => service)
      .map(service => service.toObject())
      .defaultIfEmpty(null));
}

function openHpeSession(account) {
  return HpeApi.connect();
}

function getHpeCiServer(hpeSession, account) {
  return HpeApi.createCiServer(hpeSession, {
    instanceId: account.name,
    name: account.name,
  });
}

function mapBuildLogStepToPipelineStep(name) {
  if(name === 'Initializing Process') {
    return 'clone-repository';
  }

  if(name === 'Building Docker Image') {
    return 'build-dockerfile';
  }

  if(name === 'Saving Image to Local Storage') {
    return 'push-docker-registry';
  }

  if(name === 'Running Unit Tests') {
    return 'unit-test-script';
  }
}

function processBuildLogStep(buildLogStep) {

}

function processBuildLogSteps(buildLogRef) {
  const buildLogStepsRef = buildLogRef.child('steps').shareReplay();
  const buildLogStepsAdded = buildLogStepsRef.flatMap(stepsRef => stepsRef.rx_onChildAdded());
  const buildLogStepsChanged = buildLogStepsRef.flatMap(stepsRef => stepsRef.rx_onChildChanged());
  const constBuildLogStepsEvents = Rx.Observable.merge(buildLogStepsAdded, buildLogStepsChanged);

  return constBuildLogStepsEvents
    .map(snapshot => snapshot.val());
}


class RunningBuildStep {
  static create(buildLogRef) {
    return Rx.Observable.defer(() => {
      const account = findAccount(buildLogRef).shareReplay();
      const service = findService(buildLogRef).shareReplay();
      return processBuildLogSteps(buildLogRef);


      const hpeSession = account.flatMap(openHpeSession).shareReplay();
      const hpeCiServer = Rx.Observable.zip(hpeSession, account, createCiServer).shareReplay();
    });
  }
}

export default RunningBuildStep;
