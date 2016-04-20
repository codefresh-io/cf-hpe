'use strict';
import _ from 'lodash';
import Rx from 'rx';

class RequestRx {
    static post(request, options) {
        return RequestRx.request(request, _.assign(
            options, {
                method: 'POST'
            }));
    }

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
}

export default RequestRx;
