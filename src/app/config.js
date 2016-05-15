import config from '12factor-config';

export default config({
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
});
