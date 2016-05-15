'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable no-console */


var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Logger = function () {
  _createClass(Logger, null, [{
    key: 'getLogger',
    value: function getLogger(category) {
      return new Logger(category);
    }
  }]);

  function Logger(category) {
    _classCallCheck(this, Logger);

    this.category = category;
  }

  _createClass(Logger, [{
    key: 'debug',
    value: function debug(message) {
      for (var _len = arguments.length, values = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        values[_key - 1] = arguments[_key];
      }

      this.log('debug', _util2.default.format.apply(_util2.default, [message].concat(values)));
    }
  }, {
    key: 'info',
    value: function info(message) {
      for (var _len2 = arguments.length, values = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        values[_key2 - 1] = arguments[_key2];
      }

      this.log('info', _util2.default.format.apply(_util2.default, [message].concat(values)));
    }
  }, {
    key: 'warn',
    value: function warn(message) {
      for (var _len3 = arguments.length, values = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
        values[_key3 - 1] = arguments[_key3];
      }

      this.log('warn', _util2.default.format.apply(_util2.default, [message].concat(values)));
    }
  }, {
    key: 'error',
    value: function error(message) {
      for (var _len4 = arguments.length, values = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
        values[_key4 - 1] = arguments[_key4];
      }

      this.log('error', _util2.default.format.apply(_util2.default, [message].concat(values)));
    }
  }, {
    key: 'exception',
    value: function exception(error) {
      this.log('error', error.stack);
    }
  }, {
    key: 'log',
    value: function log(level, message) {
      var format = _util2.default.format('[%s] [%s] %s - %s', new Date().toISOString(), level, this.category, message);
      console[level](format);
    }
  }]);

  return Logger;
}();

exports.default = Logger;