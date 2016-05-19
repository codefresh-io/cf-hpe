'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Logger = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable no-console */


var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Logger = exports.Logger = function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9sb2dnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBOzs7Ozs7OztJQUVhLE0sV0FBQSxNOzs7OEJBQ00sUSxFQUFVO0FBQ3pCLGFBQU8sSUFBSSxNQUFKLENBQVcsUUFBWCxDQUFQO0FBQ0Q7OztBQUVELGtCQUFZLFFBQVosRUFBc0I7QUFBQTs7QUFDcEIsU0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0Q7Ozs7MEJBRUssTyxFQUFvQjtBQUFBLHdDQUFSLE1BQVE7QUFBUixjQUFRO0FBQUE7O0FBQ3hCLFdBQUssR0FBTCxDQUFTLE9BQVQsRUFBa0IsZUFBSyxNQUFMLHdCQUFZLE9BQVosU0FBd0IsTUFBeEIsRUFBbEI7QUFDRDs7O3lCQUVJLE8sRUFBb0I7QUFBQSx5Q0FBUixNQUFRO0FBQVIsY0FBUTtBQUFBOztBQUN2QixXQUFLLEdBQUwsQ0FBUyxNQUFULEVBQWlCLGVBQUssTUFBTCx3QkFBWSxPQUFaLFNBQXdCLE1BQXhCLEVBQWpCO0FBQ0Q7Ozt5QkFFSSxPLEVBQW9CO0FBQUEseUNBQVIsTUFBUTtBQUFSLGNBQVE7QUFBQTs7QUFDdkIsV0FBSyxHQUFMLENBQVMsTUFBVCxFQUFpQixlQUFLLE1BQUwsd0JBQVksT0FBWixTQUF3QixNQUF4QixFQUFqQjtBQUNEOzs7MEJBRUssTyxFQUFvQjtBQUFBLHlDQUFSLE1BQVE7QUFBUixjQUFRO0FBQUE7O0FBQ3hCLFdBQUssR0FBTCxDQUFTLE9BQVQsRUFBa0IsZUFBSyxNQUFMLHdCQUFZLE9BQVosU0FBd0IsTUFBeEIsRUFBbEI7QUFDRDs7OzhCQUVTLEssRUFBTztBQUNmLFdBQUssR0FBTCxDQUFTLE9BQVQsRUFBa0IsTUFBTSxLQUF4QjtBQUNEOzs7d0JBRUcsSyxFQUFPLE8sRUFBUztBQUNsQixVQUFNLFNBQVMsZUFBSyxNQUFMLENBQ2IsbUJBRGEsRUFFYixJQUFJLElBQUosR0FBVyxXQUFYLEVBRmEsRUFHYixLQUhhLEVBSWIsS0FBSyxRQUpRLEVBS2IsT0FMYSxDQUFmO0FBTUEsY0FBUSxLQUFSLEVBQWUsTUFBZjtBQUNEIiwiZmlsZSI6ImxpYi9sb2dnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5pbXBvcnQgdXRpbCBmcm9tICd1dGlsJztcblxuZXhwb3J0IGNsYXNzIExvZ2dlciB7XG4gIHN0YXRpYyBnZXRMb2dnZXIoY2F0ZWdvcnkpIHtcbiAgICByZXR1cm4gbmV3IExvZ2dlcihjYXRlZ29yeSk7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihjYXRlZ29yeSkge1xuICAgIHRoaXMuY2F0ZWdvcnkgPSBjYXRlZ29yeTtcbiAgfVxuXG4gIGRlYnVnKG1lc3NhZ2UsIC4uLnZhbHVlcykge1xuICAgIHRoaXMubG9nKCdkZWJ1ZycsIHV0aWwuZm9ybWF0KG1lc3NhZ2UsIC4uLnZhbHVlcykpO1xuICB9XG5cbiAgaW5mbyhtZXNzYWdlLCAuLi52YWx1ZXMpIHtcbiAgICB0aGlzLmxvZygnaW5mbycsIHV0aWwuZm9ybWF0KG1lc3NhZ2UsIC4uLnZhbHVlcykpO1xuICB9XG5cbiAgd2FybihtZXNzYWdlLCAuLi52YWx1ZXMpIHtcbiAgICB0aGlzLmxvZygnd2FybicsIHV0aWwuZm9ybWF0KG1lc3NhZ2UsIC4uLnZhbHVlcykpO1xuICB9XG5cbiAgZXJyb3IobWVzc2FnZSwgLi4udmFsdWVzKSB7XG4gICAgdGhpcy5sb2coJ2Vycm9yJywgdXRpbC5mb3JtYXQobWVzc2FnZSwgLi4udmFsdWVzKSk7XG4gIH1cblxuICBleGNlcHRpb24oZXJyb3IpIHtcbiAgICB0aGlzLmxvZygnZXJyb3InLCBlcnJvci5zdGFjayk7XG4gIH1cblxuICBsb2cobGV2ZWwsIG1lc3NhZ2UpIHtcbiAgICBjb25zdCBmb3JtYXQgPSB1dGlsLmZvcm1hdChcbiAgICAgICdbJXNdIFslc10gJXMgLSAlcycsXG4gICAgICBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBsZXZlbCxcbiAgICAgIHRoaXMuY2F0ZWdvcnksXG4gICAgICBtZXNzYWdlKTtcbiAgICBjb25zb2xlW2xldmVsXShmb3JtYXQpO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
