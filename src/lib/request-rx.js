import _ from 'lodash';
import Rx from 'rx';

function httpRequest(request, options) {
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

function httpPost(request, options) {
  return httpRequest(request, _.assign(
    options, {
      method: 'POST',
    }));
}

function httpPut(request, options) {
  return httpRequest(request, _.assign(
    options, {
      method: 'PUT',
    }));
}

export default {
  request: httpRequest,
  post: httpPost,
  put: httpPut,
};
