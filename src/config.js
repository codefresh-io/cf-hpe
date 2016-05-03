import config from '12factor-config';

const theConfig = config({
  HPE_SERVER_URL: {
    env: 'HPE_SERVER_URL',
    type: 'string',
    required: true,
  },

  HPE_USER: {
    env: 'HPE_USER',
    type: 'string',
    required: true,
  },

  HPE_PASSWORD: {
    env: 'HPE_PASSWORD',
    type: 'string',
    required: true,
  },

  HPE_SHARED_SPACE: {
    env: 'HPE_SHARED_SPACE',
    type: 'string',
    required: true,
  },

  HPE_WORKSPACE: {
    env: 'HPE_WORKSPACE',
    type: 'string',
    required: true,
  },

  NODE_ENV: {
    env: 'NODE_ENV',
    type: 'enum',
    values: ['development', 'test', 'stage', 'production'],
  },
});

export default theConfig;
