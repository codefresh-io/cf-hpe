'use strict';

import Rx from 'rx';
import request from 'request';

function RequestRx(options) {
  return Rx.Observable.create(observer => {
    request(options, (error, response, body) => {
      if (error) {
        observer.onError(error);
        return;
      }

      observer.onNext(response, body);
      observer.onCompleted();
    });
  });
}

export default RequestRx;
