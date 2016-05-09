import config from '12factor-config';

export default config({
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
