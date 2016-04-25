'use strict';
import _ from 'lodash';
import Util from 'util';
import Request from 'request';
import HpeError from './hpe-error';
import RequestRx from './request-rx';
import Config from '../config.json';

class HpeAuthError extends HpeError {
  constructor(errorCode, message) {
    super(errorCode, message);
  }
}

class HpeRequestError extends HpeError {
  constructor(errorCode, message) {
    super(errorCode, message);
  }
}

class Hpe {
  static session() {
    const authCookies = Request.jar();
    const authRequest = Request.defaults({
      jar: authCookies
    });

    const options = {
      uri: Config.hpe.serverUrl + '/authentication/sign_in/',
      json: true,
      body: {
        'user': Config.hpe.user,
        'password': Config.hpe.password
      },
    };

    return RequestRx
      .post(authRequest, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeAuthError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        const csrfToken =
          _(authCookies.getCookies(Config.hpe.serverUrl))
            .find(cookie => cookie.key === 'HPSSO_COOKIE_CSRF')
            .value;

        return {
          request: authRequest.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': csrfToken
            }
          })
        };
      });
  }

  static createServer(session, server) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/ci_servers/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);

    const data = {
      name: server.name,
      instance_id: _.kebabCase(server.name),
      url: 'http://codefresh.io/',
      server_type: 'Codefresh'
    };

    const options = {
      uri: uri,
      json: true,
      body: {
        data: [data]
      },
    };

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 201) {
          throw new HpeRequestError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return response.body.data[0];
      });
  }

  static createPipeline(session, pipeline) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/pipelines/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);

    const rootJobID = 'root-' + _.kebabCase(pipeline.name);
    const data = {
      name: pipeline.name,
      root_job_ci_id: rootJobID,
      ci_server: {
        type: 'ci_server',
        id: pipeline.serverID
      },
      jobs: [
        {
          jobCiId: rootJobID,
          name: rootJobID
        },
        {
          jobCiId: rootJobID + '-clone-repository',
          name: 'Clone Repository'
        },
        {
          jobCiId: rootJobID + '-build-dockerfile',
          name: 'Build Dockerfile'
        },
        {
          jobCiId: rootJobID + '-unit-test-script',
          name: 'Unit Test Script'
        },
        {
          jobCiId: rootJobID + '-push-docker-registry',
          name: 'Push to Docker Registry'
        },
        {
          jobCiId: rootJobID + '-integration-test-script',
          name: 'Integration Test Script'
        },
        {
          jobCiId: rootJobID + '-deploy-script',
          name: 'Deploy Script'
        }
      ]
    };

    const options = {
      uri: uri,
      json: true,
      body: {
        data: [data]
      },
    };

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 201) {
          throw new HpeRequestError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return response.body.data[0];
      });
  }

  static createPipelineBuild(session, data) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/analytics/ci/builds/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);

    const options = {
      uri: uri,
      json: true,
      body: {
        data: [data]
      },
    };

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 201) {
          throw new HpeRequestError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return response.body.data[0];
      });
  }
}

export default Hpe;