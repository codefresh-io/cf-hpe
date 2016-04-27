'use strict';
import _ from 'lodash';
import Util from 'util';
import Request from 'request';
import HpeError from './hpe-error';
import HpePipeline from './hpe-pipeline';
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
      instance_id: server.instanceId,
      name: server.name,
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

        return _.assign({}, response.body.data[0], data);
      });
  }

  static createPipeline(session, pipeline) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/pipelines/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);

    const pipelineId = _.kebabCase(pipeline.name);
    const pipelineJobs = HpePipeline.jobs(pipelineId);

    const data = {
      name: pipeline.name,
      root_job_ci_id: pipelineJobs[0].jobCiId,
      ci_server: {
        type: 'ci_server',
        id: pipeline.serverId
      },
      jobs: pipelineJobs
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

        return _.assign({}, response.body.data[0], data);
      });
  }

  static reportPipelineStepStatus(session, stepStatus) {
    const uri = Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s/analytics/ci/builds/',
      Config.hpe.serverUrl,
      Config.hpe.sharedSpace,
      Config.hpe.workspace);

    const data = {
      serverCiId: stepStatus.serverInstanceId,
      jobCiId: HpePipeline.jobId(stepStatus.pipelineId, stepStatus.stepId),
      buildCiId: stepStatus.buildId,
      buildName: stepStatus.buildName,
      startTime: stepStatus.startTime,
      duration: stepStatus.duration,
      status: stepStatus.status,
      result: stepStatus.result
    };

    const options = {
      uri: uri,
      json: true,
      body: data
    };

    return RequestRx
      .put(session.request, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeRequestError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return response.body;
      });
  }
}

export default Hpe;
