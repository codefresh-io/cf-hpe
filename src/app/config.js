import config from '12factor-config';

export default config({
  mongodbUrl: {
    env: 'CF_HPE_MONGODB_URL',
    type: 'string',
    required: true,
  },

  firebaseUrl: {
    env: 'CF_HPE_FIREBASE_URL',
    type: 'string',
    required: true,
  },

  firebaseSecret: {
    env: 'CF_HPE_FIREBASE_SECRET',
    type: 'string',
    required: true,
  },

  firebaseBuildLogsPath: {
    env: 'CF_HPE_FIREBASE_BUILD_LOGS_PATH',
    type: 'string',
    required: true,
  },
});
