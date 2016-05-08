import _ from 'lodash';
import Util from 'util';
import Xml2js from 'xml2js';
import Request from 'request';
import HpeError from 'lib/hpe-error';
import HpePipeline from 'lib/hpe-pipeline';
import RequestRx from 'lib/request-rx';
import config from 'cf-hpe/config';

function workspaceUri() {
  return Util.format(
    '%s/api/shared_spaces/%s/workspaces/%s',
    config.HPE_SERVER_URL,
    config.HPE_SHARED_SPACE,
    config.HPE_WORKSPACE);
}

class HpeAuthError extends HpeError {
}

class HpeRequestError extends HpeError {
}

class Hpe {
  static session() {
    const authCookies = Request.jar();
    const authRequest = Request.defaults({
      jar: authCookies,
    });

    const options = {
      uri: Util.format('%s/authentication/sign_in/', config.HPE_SERVER_URL),
      json: true,
      body: {
        user: config.HPE_USER,
        password: config.HPE_PASSWORD,
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
          _(authCookies.getCookies(config.HPE_SERVER_URL))
            .find(cookie => cookie.key === 'HPSSO_COOKIE_CSRF')
            .value;

        return {
          request: authRequest.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': csrfToken,
            },
          }),
        };
      });
  }

  static createServer(session, server) {
    const uri = Util.format('%s/ci_servers/', workspaceUri());
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
    const uri = Util.format('%s/pipelines/', workspaceUri());
    const pipelineId = _.kebabCase(pipeline.name);
    const pipelineJobs = HpePipeline.jobs(pipelineId);

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
    const uri = Util.format('%s/analytics/ci/builds/', workspaceUri());

    const jobCiId = HpePipeline.jobId(stepStatus.pipelineId, stepStatus.stepId);
    const rootJobCiId = HpePipeline.jobId(stepStatus.pipelineId, 'root');

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

    return RequestRx
      .put(session.request, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeRequestError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body, data);
      });
  }

  static reportPipelineTestResults(session, testResult) {
    const uri = Util.format('%s/test-results/', workspaceUri());
    const jobCiId = HpePipeline.jobId(testResult.pipelineId, testResult.stepId);

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

    return RequestRx
      .post(session.request, options)
      .map(response => {
        if (response.statusCode !== 202) {
          throw new HpeRequestError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body, data);
      });
  }
}

export default Hpe;