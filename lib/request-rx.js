import _ from 'lodash';
import Rx from 'rx';

class RequestRx {
  static request(request, options) {
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

  static post(request, options) {
    return RequestRx.request(request, _.assign(
      options, {
        method: 'POST',
      }));
  }

  static put(request, options) {
    return RequestRx.request(request, _.assign(
      options, {
        method: 'PUT',
      }));
  }
}

export default RequestRx;
