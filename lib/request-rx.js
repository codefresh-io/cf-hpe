'use strict';
import _ from 'lodash';
import Rx from 'rx';
import request from 'request';

class RequestRx {
  static jar() {
    return request.jar();
  }  
  
  static get(options) {
    return request(_.assign(options, {method: 'GET'}));
  }

  static post(options) {
    return RequestRx.request(_.assign(
      options, {
        method: 'POST'
      }));
  }

  static request(options) {
    return Rx.Observable.create(observer => {
      request(options, (error, response) => {
        if (error) {
          observer.onError(error);
          return;
        }

        observer.onNext(response);
        observer.onCompleted();
      });
    });
  }
}

export default RequestRx;
