import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, Service, Build, objectId } from './model';
import { HpeApi, HpeApiPipeline } from 'lib/hpe-api';
import config from './config';

class BuildProgress {
  static create(buildLogRef) {
    return Rx.Observable.defer(() => {
      const account = BuildProgress.findAccount(buildLogRef).shareReplay();
      const service = BuildProgress.findService(buildLogRef).shareReplay();
      const hpeSession = account.flatMap(BuildProgress.openHpeSession).shareReplay();
      const hpeCiServer = Rx.Observable
        .zip(
          hpeSession,
          account,
          BuildProgress.createCiServer())
        .shareReplay();
    });
  }

  static monitorBuildProgressEvents() {

  }

  static mapBuildToHpePipeline(build) {

  }

  static mapBuildStepToHpePipelineStep(step) {

  }

  static updateHpePipelineStatus() {

  }

  static getBuildProgressEvents(buildLogRef) {
    return buildLogRef
      .child('steps')
      .rx_onValue()
      .map(snapthot => snapthot.val());
  }

  static findAccount(buildLogRef) {
    return buildLogRef
      .rx_onceValue().map(snapshot => snapshot.val())
      .flatMap(buildLog => Rx.Observable
        .fromPromise(() => Account.findOne({ _id: objectId(buildLog.accountId) }))
        .takeWhile(account => account)
        .map(account => account.toObject())
        .defaultIfEmpty(null));
  }

  static findService(buildLogRef) {
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

  static openHpeSession(account) {
    return HpeApi.connect();
  }

  static createCiServer(hpeSession, account) {
    return HpeApi.createCiServer(hpeSession, {
      instanceId: account.name,
      name: account.name,
    });
  }
}

export default BuildProgress;
