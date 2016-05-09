import Firebase from 'firebase';
import { } from 'firebase-rx';
import config from './config';

class HpeService {
  static createService() {
    const hpeService = new HpeService();
    const buildLogsRef = new Firebase(config.CF_HPE_FIREBASE_URL);

    return buildLogsRef
      .rx_authWithCustomToken(config.authToken)
      .flatMap(() => buildLogsRef.rx_childAdded())
      .map(snapshot => snapshot.val())
      .map(buildLog => {
        return buildLog;
      })
      .subscribe();
  }
}

export default HpeService;
