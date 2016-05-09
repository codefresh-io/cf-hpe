import Firebase from 'firebase';
import Rx from 'rx';
import 'firebase-rx';
import config from './config';

class HpeService {
  static createService() {
    return Rx.Observable.defer(() => {
      const rootRef = new Firebase(config.CF_HPE_FIREBASE_URL);
      rootRef
        .rx_authWithSecretToken(config.CF_HPE_FIREBASE_SECRET, 'hpe-service');

    });
  }
}

export default HpeService;
