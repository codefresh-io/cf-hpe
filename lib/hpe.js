'use strict';

import _ from 'lodash';
import Rx from 'rx';
import RequestRx from './request-rx';
import config from '../config.json';

class HpeError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class HpeAuthError extends HpeError {
  constructor(statusCode) {
    super("HpeAuthError", statusCode);
  }
}

class Hpe {
  static authenticate() {

    const options = {
      uri: config.hpe.serverUrl + '/authentication/sign_in/',
      json: true,
      body: {
        'user': config.hpe.user,
        'password': config.hpe.password
      },
    };

    return RequestRx
      .post(options)
      .map(response => {
        if(response.statusCode !== 200) {
          throw new HpeAuthError(response.statusCode);
        }

        const authCookies = response;

      });
  }

  /*
   1 = "LWSSO_COOKIE_KEY=iWxIHB8gEL_wvCf5uqVR6Xbbxa1yRwIlecUmSBQdrAufvx1j4gIOwOVOPovwkM3LoHRasYf4svoeSpqKtujt5eialWfSBrY1Qc_UTYa8hm0_CKXhBUQKm2-lX1zxLkcl99q9s_5oARSCCBmg4vJIB2kHdHeM_FovFVbSsK7zZxul4r-kem2dALEoaop77beh6bB_un4Un5f9jPFR-KFPsY4Vh_rK7asicQFfPQATx_NO4DPZk146U-fcr-gpOBS_DLD8t1BU2XZ-wJTdMGYzSoK680vZf59J-6jSM2q20iFL_5pYy2arrE6VybFbG9JC5St766nx8P7hpmOYVpK6yEEh9ryxtegLyVqmln4sRVIz8_0ePMY9-LIa6OOLvLTM6U3VYXB9UCSQqlfJTWsr3QIaJJ92W0B30lHdjKq4X9Db1USLCIJJxEjiX2k4ag7i;Version=1;Domain=.hpswlabs.adapps.hp.com;Path=/;Max-Age=86400;HttpOnly"
   2 = "HPSSO_COOKIE_CSRF=4kkalp0vcga0cme530o0rl6dtt;Version=1;Domain=.hpswlabs.adapps.hp.com;Path=/;Max-Age=86400"
   */


  static createCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static getCIServer() {
    return Rx.Observable.throw(new HpeError("failed"));
  }

  static createPipeLine() {
    return Rx.Observable.throw(new HpeError("failed"));
  }
}

export default Hpe;
