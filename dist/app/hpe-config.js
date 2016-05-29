'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpeConfig = undefined;

var _factorConfig = require('12factor-config');

var _factorConfig2 = _interopRequireDefault(_factorConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HpeConfig = exports.HpeConfig = (0, _factorConfig2.default)({
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
  },

  hpeServerUrl: {
    env: 'CF_HPE_SERVER_URL',
    type: 'string',
    required: true
  },

  hpeUser: {
    env: 'CF_HPE_USER',
    type: 'string',
    required: true
  },

  hpePassword: {
    env: 'CF_HPE_PASSWORD',
    type: 'string',
    required: true
  },

  hpeSharedSpace: {
    env: 'CF_HPE_SHARED_SPACE',
    type: 'string',
    required: true
  },

  hpeWorkspace: {
    env: 'CF_HPE_WORKSPACE',
    type: 'string',
    required: true
  }
});