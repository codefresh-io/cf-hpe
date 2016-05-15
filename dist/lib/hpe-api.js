'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _xml2js = require('xml2js');

var _xml2js2 = _interopRequireDefault(_xml2js);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _requestRx = require('./request-rx');

var _requestRx2 = _interopRequireDefault(_requestRx);

var _hpeApiError = require('./hpe-api-error');

var _hpeApiError2 = _interopRequireDefault(_hpeApiError);

var _hpeApiPipeline = require('./hpe-api-pipeline');

var _hpeApiPipeline2 = _interopRequireDefault(_hpeApiPipeline);

var _hpeApiConfig = require('./hpe-api-config');

var _hpeApiConfig2 = _interopRequireDefault(_hpeApiConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function getWorkspaceUri(session) {
  return _util2.default.format('%s/api/shared_spaces/%s/workspaces/%s', session.config.hpeServerUrl, session.config.hpeSharedSpace, session.config.hpeWorkspace);
}

var HpeApi = function () {
  function HpeApi() {
    _classCallCheck(this, HpeApi);
  }

  _createClass(HpeApi, null, [{
    key: 'connect',
    value: function connect() {
      var jar = _request2.default.jar();
      var signInRequest = _request2.default.defaults({ jar: jar });
      var options = {
        uri: _util2.default.format('%s/authentication/sign_in/', _hpeApiConfig2.default.hpeServerUrl),
        json: true,
        body: {
          user: _hpeApiConfig2.default.hpeUser,
          password: '=211cb1cdb045df37I'
        }
      };

      return _requestRx2.default.post(signInRequest, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        var csrfToken = (0, _lodash2.default)(jar.getCookies(_hpeApiConfig2.default.hpeServerUrl)).find(function (cookie) {
          return cookie.key === 'HPSSO_COOKIE_CSRF';
        }).value;

        return {
          config: _hpeApiConfig2.default,
          request: signInRequest.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': csrfToken
            }
          })
        };
      });
    }
  }, {
    key: 'findCiServer',
    value: function findCiServer(session, instanceId) {
      var options = {
        uri: _util2.default.format('%s/ci_servers/', getWorkspaceUri(session)),
        json: true
      };

      return _requestRx2.default.get(session.request, options).flatMap(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _rx2.default.Observable.from(response.body.data).first(function (ciServer) {
          return ciServer.instance_id === instanceId;
        }, null, null);
      });
    }
  }, {
    key: 'createCiServer',
    value: function createCiServer(session, server) {
      var data = {
        instance_id: server.instanceId,
        name: server.name,
        url: 'http://codefresh.io/',
        server_type: 'Codefresh'
      };

      var options = {
        uri: _util2.default.format('%s/ci_servers/', getWorkspaceUri(session)),
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx2.default.post(session.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeApiError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'createPipeline',
    value: function createPipeline(session, pipeline) {
      var pipelineJobs = _hpeApiPipeline2.default.jobs(pipeline.id);
      var data = {
        name: pipeline.name,
        root_job_ci_id: pipelineJobs[0].jobCiId,
        ci_server: {
          type: 'ci_server',
          id: pipeline.serverId
        },
        jobs: pipelineJobs
      };

      var options = {
        uri: _util2.default.format('%s/pipelines/', getWorkspaceUri(session)),
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx2.default.post(session.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeApiError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'reportPipelineStepStatus',
    value: function reportPipelineStepStatus(session, stepStatus) {
      var jobCiId = _hpeApiPipeline2.default.jobId(stepStatus.pipelineId, stepStatus.stepId);
      var rootJobCiId = _hpeApiPipeline2.default.jobId(stepStatus.pipelineId, 'pipeline');

      var data = {
        serverCiId: stepStatus.serverInstanceId,
        jobCiId: jobCiId,
        buildCiId: stepStatus.buildId,
        buildName: stepStatus.buildName,
        startTime: stepStatus.startTime,
        duration: stepStatus.duration,
        status: stepStatus.status,
        result: stepStatus.result
      };

      if (jobCiId !== rootJobCiId) {
        data.causes = [{
          jobCiId: rootJobCiId,
          buildCiId: stepStatus.buildId
        }];
      }

      var options = {
        uri: _util2.default.format('%s/analytics/ci/builds/', getWorkspaceUri(session)),
        json: true,
        body: data
      };

      return _requestRx2.default.put(session.request, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }, {
    key: 'reportPipelineTestResults',
    value: function reportPipelineTestResults(session, testResult) {
      var jobCiId = _hpeApiPipeline2.default.jobId(testResult.pipelineId, testResult.stepId);
      var builder = new _xml2js2.default.Builder();
      var data = builder.buildObject({
        test_result: {
          build: {
            $: {
              server_id: testResult.serverInstanceId,
              job_id: jobCiId,
              job_name: jobCiId,
              build_id: testResult.buildId,
              build_name: testResult.buildId
            }
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
                class: testResult.testRuns[0].class
              }
            }
          }
        }
      });

      var options = {
        uri: _util2.default.format('%s/test-results/', getWorkspaceUri(session)),
        'content-type': 'application/xml',
        body: data
      };

      return _requestRx2.default.post(session.request, options).map(function (response) {
        if (response.statusCode !== 202) {
          throw new _hpeApiError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }]);

  return HpeApi;
}();

exports.default = HpeApi;