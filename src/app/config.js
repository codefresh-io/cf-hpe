import config from '12factor-config';

export default config({
  CF_HPE_FIREBASE_URL: {
    env: 'CF_HPE_FIREBASE_URL',
    type: 'string',
    required: true,
  },

  CF_HPE_FIREBASE_SECRET: {
    env: 'CF_HPE_FIREBASE_SECRET',
    type: 'string',
    required: true,
  },
});
