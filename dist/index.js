'use strict';

require('./config.env');

var _build = require('./app/build');

var _build2 = _interopRequireDefault(_build);

var _buildStep = require('./app/build-step');

var _buildStep2 = _interopRequireDefault(_buildStep);

var _hpeBuildSession = require('./app/hpe-build-session');

var _hpeBuildSession2 = _interopRequireDefault(_hpeBuildSession);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_build2.default.builds().flatMap(function (build) {
  return _hpeBuildSession2.default.openSession(build).flatMap(function (buildSession) {
    return _buildStep2.default.steps(build).flatMap(function (step) {
      return _hpeBuildSession2.default.reportStepStatus(buildSession, step);
    });
  });
}).subscribe();