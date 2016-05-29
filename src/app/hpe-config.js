import config from '12factor-config';

export const HpeConfig = config({
  mongodbUrl: {
    env: 'CF_HPE_MONGODB_URL',
    type: 'string',
    required: true,
  },

  firebaseBuildLogsUrl: {
    env: 'CF_HPE_FIREBASE_BUILD_LOGS_URL',
    type: 'string',
    required: true,
  },

  firebaseSecret: {
    env: 'CF_HPE_FIREBASE_SECRET',
    type: 'string',
    required: true,
  },

  buildTimeout: {
    env: 'CF_HPE_BUILD_TIMEOUT',
    type: 'integer',
    default: 600,
  },

  hpeServerUrl: {
    env: 'CF_HPE_SERVER_URL',
    type: 'string',
    required: true,
  },

  hpeUser: {
    env: 'CF_HPE_USER',
    type: 'string',
    required: true,
  },

  hpePassword: {
    env: 'CF_HPE_PASSWORD',
    type: 'string',
    required: true,
  },

  hpeSharedSpace: {
    env: 'CF_HPE_SHARED_SPACE',
    type: 'string',
    required: true,
  },

  hpeWorkspace: {
    env: 'CF_HPE_WORKSPACE',
    type: 'string',
    required: true,
  },
});

