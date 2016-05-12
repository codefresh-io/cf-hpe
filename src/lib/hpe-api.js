import _ from 'lodash';
import Rx from 'rx';
import Util from 'util';
import Xml2js from 'xml2js';
import request from 'request';
import RequestRx from 'lib/request-rx';
import HpeApiError from 'lib/hpe-api-error';
import HpeApiPipeline from 'lib/hpe-api-pipeline';
import config from './config';

class HpeApi {
  constructor() {
    this.session = this.connect().shareReplay();
  }

  getWorkspaceUri() {
    return Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s',
      config.CF_HPE_SERVER_URL,
      config.CF_HPE_SHARED_SPACE,
      config.CF_HPE_WORKSPACE);
  }

  connect() {
    const jar = request.jar();
    const signInRequest = request.defaults({ jar });
    const options = {
      uri: Util.format('%s/authentication/sign_in/', config.CF_HPE_SERVER_URL),
      json: true,
      body: {
        user: config.CF_HPE_USER,
        password: config.CF_HPE_PASSWORD,
      },
    };

    return RequestRx
      .from(signInRequest)
      .post(options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeApiError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        const csrfToken =
          _(jar.getCookies(config.CF_HPE_SERVER_URL))
            .find(cookie => cookie.key === 'HPSSO_COOKIE_CSRF')
            .value;

        const session = signInRequest.defaults({
          headers: {
            'HPSSO-HEADER-CSRF': csrfToken,
          },
        });

        return RequestRx.from(session);
      });
  }

  createCiServer(server) {
    const uri = Util.format('%s/ci_servers/', this.getWorkspaceUri());
    const data = {
      instance_id: server.instanceId,
      name: server.name,
      url: 'http://codefresh.io/',
      server_type: 'Codefresh',
    };

    const options = {
      uri,
      json: true,
      body: {
        data: [data],
      },
    };

    return this.session
      .flatMap(session => session.post(options))
      .map(response => {
        if (response.statusCode !== 201) {
          throw new HpeApiError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body.data[0], data);
      });
  }

  createPipeline(pipeline) {
    const uri = Util.format('%s/pipelines/', this.getWorkspaceUri());
    const pipelineId = _.kebabCase(pipeline.name);
    const pipelineJobs = HpeApiPipeline.jobs(pipelineId);

    const data = {
      name: pipeline.name,
      root_job_ci_id: pipelineJobs[0].jobCiId,
      ci_server: {
        type: 'ci_server',
        id: pipeline.serverId,
      },
      jobs: pipelineJobs,
    };

    const options = {
      uri,
      json: true,
      body: {
        data: [data],
      },
    };

    return this.session
      .flatMap(session => session.post(options))
      .map(response => {
        if (response.statusCode !== 201) {
          throw new HpeApiError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body.data[0], data);
      });
  }

  reportPipelineStepStatus(stepStatus) {
    const uri = Util.format('%s/analytics/ci/builds/', this.getWorkspaceUri());
    const jobCiId = HpeApiPipeline.jobId(stepStatus.pipelineId, stepStatus.stepId);
    const rootJobCiId = HpeApiPipeline.jobId(stepStatus.pipelineId, 'root');

    const data = {
      serverCiId: stepStatus.serverInstanceId,
      jobCiId,
      buildCiId: stepStatus.buildId,
      buildName: stepStatus.buildName,
      startTime: stepStatus.startTime,
      duration: stepStatus.duration,
      status: stepStatus.status,
      result: stepStatus.result,
    };

    if (jobCiId !== rootJobCiId) {
      data.causes = [
        {
          jobCiId: rootJobCiId,
          buildCiId: stepStatus.buildId,
        },
      ];
    }

    const options = {
      uri,
      json: true,
      body: data,
    };

    return this.session
      .flatMap(session => session.put(options))
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeApiError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body, data);
      });
  }

  reportPipelineTestResults(testResult) {
    const uri = Util.format('%s/test-results/', this.getWorkspaceUri());
    const jobCiId = HpeApiPipeline.jobId(testResult.pipelineId, testResult.stepId);

    const builder = new Xml2js.Builder();
    const data = builder.buildObject({
      test_result: {
        build: {
          $: {
            server_id: testResult.serverInstanceId,
            job_id: jobCiId,
            job_name: jobCiId,
            build_id: testResult.buildId,
            build_name: testResult.buildId,
          },
        },
        test_runs: {
          test_run: {
            $: {
              name: testResult.testRuns[0].testName,
              started: testResult.testRuns[0].started,
              duration: testResult.testRuns[0].duration,
              status: testResult.testRuns[0].status,
              module: testResult.testRuns[0].module,
              package: testResult.testRuns[0].package,
              class: testResult.testRuns[0].class,
            },
          },
        },
      },
    });

    const options = {
      uri,
      'content-type': 'application/xml',
      body: data,
    };

    return this.session
      .flatMap(session => session.post(options))
      .map(response => {
        if (response.statusCode !== 202) {
          throw new HpeApiError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body, data);
      });
  }
}

export default HpeApi;
