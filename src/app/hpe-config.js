import config from '12factor-config';

export const HpeConfig = config({
  CF_HPE_MONGODB_URL: {
    env: 'CF_HPE_MONGODB_URL',
    type: 'string',
    required: true,
  },

  CF_HPE_FIREBASE_BUILD_LOGS_URL: {
    env: 'CF_HPE_FIREBASE_BUILD_LOGS_URL',
    type: 'string',
    required: true,
  },

  CF_HPE_FIREBASE_SECRET: {
    env: 'CF_HPE_FIREBASE_SECRET',
    type: 'string',
    required: true,
  },

  CF_HPE_INTEGRATION_ACCOUNT: {
    env: 'CF_HPE_INTEGRATION_ACCOUNT',
    type: 'string',
    required: true,
  },

  CF_HPE_BUILD_TIMEOUT: {
    env: 'CF_HPE_BUILD_TIMEOUT',
    type: 'integer',
    default: 600,
  },

  CF_HPE_SERVER_URL: {
    env: 'CF_HPE_SERVER_URL',
    type: 'string',
    required: true,
  },

  CF_HPE_USER: {
    env: 'CF_HPE_USER',
    type: 'string',
    required: true,
  },

  CF_HPE_PASSWORD: {
    env: 'CF_HPE_PASSWORD',
    type: 'string',
    required: true,
  },

  CF_HPE_SHARED_SPACE: {
    env: 'CF_HPE_SHARED_SPACE',
    type: 'string',
    required: true,
  },

  CF_HPE_WORKSPACE: {
    env: 'CF_HPE_WORKSPACE',
    type: 'string',
    required: true,
  },
});

