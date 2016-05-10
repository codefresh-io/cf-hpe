import _ from 'lodash';
import Rx from 'rx';
import 'firebase-rx';
import Firebase from 'firebase';
import mongoose, { Schema } from 'mongoose';
import { Account, Service, Build, objectId } from './model';
import config from './config';

/*
 fb.build-logs.id --> mongo.builds.progress_id
 mongo.builds.serviceId --> mongo.service
 */
mongoose.connect(config.mongodbUrl);

class BuildEvents {
  static create() {
    mongoose.connect(config.mongodbUrl);
    this._buildLogsRef = Rx.Observable
      .start(() => new Firebase(config.firebaseUrl))
      .flatMap(rootRef => rootRef.rx_authWithSecretToken(config.firebaseSecret, 'hpe-service'))
      .flatMap(rootRef => rootRef.rx_child(config.firebaseBuildLogsPath));

    this._buildAddedEvents = this._buildLogsRef
      .rx_onChildAdded()
      .map(snapshot => snapshot.val());
  }

  static findServiceByProgressId(progressId) {
    return Rx.Observable
      .fromPromise(() => Build.findOne({ progress_id: objectId(progressId) }, 'serviceId'))
      .flatMap(document => Service.findOne({ _id: objectId(document.get('serviceId')) }))
      .map(document => document.toObject());
  }
}

export default BuildEvents;
