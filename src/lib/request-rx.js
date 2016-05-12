import _ from 'lodash';
import Rx from 'rx';

class RequestRx {
  constructor(request) {
    this.request = request;
  }

  static from(request) {
    return new RequestRx(request);
  }

  get(options) {
    return Rx.Observable.create(observer => {
      this.request.get(options, (error, response) => {
        if (error) {
          observer.onError(error);
          return;
        }

        observer.onNext(response);
        observer.onCompleted();
      });
    });
  }

  post(options) {
    return Rx.Observable.create(observer => {
      this.request.post(options, (error, response) => {
        if (error) {
          observer.onError(error);
          return;
        }

        observer.onNext(response);
        observer.onCompleted();
      });
    });
  }

  put(options) {
    return Rx.Observable.create(observer => {
      this.request.put(options, (error, response) => {
        if (error) {
          observer.onError(error);
          return;
        }

        observer.onNext(response);
        observer.onCompleted();
      });
    });
  }

  delete(options) {
    return Rx.Observable.create(observer => {
      this.request.delete(options, (error, response) => {
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
