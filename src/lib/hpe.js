import _ from 'lodash';
import Util from 'util';
import Xml2js from 'xml2js';
import Request from 'request';
import HpeError from 'lib/hpe-error';
import HpePipeline from 'lib/hpe-pipeline';
import RequestRx from 'lib/request-rx';

class Hpe {
  static createSession(sessionConfig) {
    const authCookies = Request.jar();
    const authRequest = Request.defaults({
      jar: authCookies,
    });

    const options = {
      uri: Util.format('%s/authentication/sign_in/', sessionConfig.serverUrl),
      json: true,
      body: {
        user: sessionConfig.user,
        password: sessionConfig.password,
      },
    };

    return RequestRx
      .post(authRequest, options)
      .map(response => {
        if (response.statusCode !== 200) {
          throw new HpeError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        const csrfToken =
          _(authCookies.getCookies(sessionConfig.serverUrl))
            .find(cookie => cookie.key === 'HPSSO_COOKIE_CSRF')
            .value;

        const request = authRequest.defaults({
          headers: {
            'HPSSO-HEADER-CSRF': csrfToken,
          },
        });

        return {
          request,
          ...sessionConfig,
        };
      });
  }

  static workspaceUri(session) {
    return Util.format(
      '%s/api/shared_spaces/%s/workspaces/%s',
      session.serverUrl,
      session.sharedSpace,
      session.workspace);
  }

  static createServer(session, server) {
    const uri = Util.format('%s/ci_servers/', Hpe.workspaceUri(session));
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
          throw new HpeError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body.data[0], data);
      });
  }

  static createPipeline(session, pipeline) {
    const uri = Util.format('%s/pipelines/', Hpe.workspaceUri(session));
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
          throw new HpeError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body.data[0], data);
      });
  }

  static reportPipelineStepStatus(session, stepStatus) {
    const uri = Util.format('%s/analytics/ci/builds/', Hpe.workspaceUri(session));

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
          throw new HpeError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body, data);
      });
  }

  static reportPipelineTestResults(session, testResult) {
    const uri = Util.format('%s/test-results/', Hpe.workspaceUri(session));
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
          throw new HpeError(
            response.statusCode,
            JSON.stringify(response.body, null, 2));
        }

        return _.assign({}, response.body, data);
      });
  }
}

export default Hpe;
