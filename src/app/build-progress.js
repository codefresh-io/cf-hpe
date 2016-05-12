import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import { Account, Service, Build, objectId } from './model';
import { HpeApi, HpeApiPipeline } from 'lib/hpe-api';
import config from './config';

class BuildProgress {
  constructor(buildLogRef) {
    this.buildLogRef = buildLogRef;
    this.hpeApi = HpeApi.create().single();
    this.account = this.findAccount().single();
    this.service = this.findService().single();
    this.buildProgressEvents = this.getBuildProgressEvents();
  }

  monitorBuildProgressEvents() {

  }

  mapBuildToHpePipeline(build) {

  }

  mapBuildStepToHpePipelineStep(step) {

  }

  updateHpePipelineStatus() {

  }

  getBuildProgressEvents() {
    return this.buildLogRef
      .child('steps')
      .rx_onValue()
      .map(snapthot => snapthot.val());
  }

  findAccount() {
    return this.buildLogRef
      .rx_onceValue().map(snapshot => snapshot.val())
      .flatMap(buildLog => Rx.Observable
        .fromPromise(() => Account.findOne({ _id: objectId(buildLog.accountId) }))
        .takeWhile(account => account)
        .map(account => account.toObject())
        .defaultIfEmpty(null));
  }

  findService() {
    return this.buildLogRef
      .rx_onceValue().map(snapshot => snapshot.val())
      .flatMap(buildLog => Rx.Observable
        .fromPromise(() => Build.findOne({ progress_id: objectId(buildLog.id) }, 'serviceId'))
        .takeWhile(progress => progress)
        .flatMap(progress => Service.findOne({ _id: objectId(progress.get('serviceId')) }))
        .takeWhile(service => service)
        .map(service => service.toObject())
        .defaultIfEmpty(null));
  }

  createCiServer() {
    this.account
      .
    const serverName = Util.format('Codefresh %d', _.now());
    const serverInstanceId = _.kebabCase(serverName);
  }
}

export default BuildProgress;
