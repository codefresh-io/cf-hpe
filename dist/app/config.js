'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _factorConfig = require('12factor-config');

var _factorConfig2 = _interopRequireDefault(_factorConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _factorConfig2.default)({
  mongodbUrl: {
    env: 'CF_HPE_MONGODB_URL',
    type: 'string',
    required: true
  },

  firebaseBuildLogsUrl: {
    env: 'CF_HPE_FIREBASE_BUILD_LOGS_URL',
    type: 'string',
    required: true
  },

  firebaseSecret: {
    env: 'CF_HPE_FIREBASE_SECRET',
    type: 'string',
    required: true
  },

  buildTimeout: {
    env: 'CF_HPE_BUILD_TIMEOUT',
    type: 'integer',
    default: 600
  }
});