'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequestRx = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RequestRx = function () {
  function RequestRx() {
    _classCallCheck(this, RequestRx);
  }

  _createClass(RequestRx, null, [{
    key: 'request',
    value: function request(_request, options) {
      return _rx2.default.Observable.create(function (observer) {
        _request(options, function (error, response) {
          if (error) {
            observer.onError(error);
            return;
          }

          observer.onNext(response);
          observer.onCompleted();
        });
      });
    }
  }, {
    key: 'post',
    value: function post(request, options) {
      return RequestRx.request(request, _lodash2.default.assign(options, {
        method: 'POST'
      }));
    }
  }, {
    key: 'put',
    value: function put(request, options) {
      return RequestRx.request(request, _lodash2.default.assign(options, {
        method: 'PUT'
      }));
    }
  }]);

  return RequestRx;
}();

exports.RequestRx = RequestRx;