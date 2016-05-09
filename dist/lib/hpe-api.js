'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpeApi = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _xml2js = require('xml2js');

var _xml2js2 = _interopRequireDefault(_xml2js);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _hpeError = require('./hpe-error');

var _hpeError2 = _interopRequireDefault(_hpeError);

var _requestRx = require('./request-rx');

var _hpePipeline = require('./hpe-pipeline');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HpeApi = function () {
  function HpeApi() {
    _classCallCheck(this, HpeApi);
  }

  _createClass(HpeApi, [{
    key: 'workspaceUri',
    value: function workspaceUri() {
      return _util2.default.format('%s/api/shared_spaces/%s/workspaces/%s', this.serverUrl, this.sharedSpace, this.workspace);
    }
  }, {
    key: 'createServer',
    value: function createServer(server) {
      var uri = _util2.default.format('%s/ci_servers/', this.workspaceUri());
      var data = {
        instance_id: server.instanceId,
        name: server.name,
        url: 'http://codefresh.io/',
        server_type: 'Codefresh'
      };

      var options = {
        uri: uri,
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx.RequestRx.post(this.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'createPipeline',
    value: function createPipeline(pipeline) {
      var uri = _util2.default.format('%s/pipelines/', this.workspaceUri());
      var pipelineId = _lodash2.default.kebabCase(pipeline.name);
      var pipelineJobs = _hpePipeline.HpePipeline.jobs(pipelineId);

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
        uri: uri,
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx.RequestRx.post(this.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'reportPipelineStepStatus',
    value: function reportPipelineStepStatus(stepStatus) {
      var uri = _util2.default.format('%s/analytics/ci/builds/', this.workspaceUri());

      var jobCiId = _hpePipeline.HpePipeline.jobId(stepStatus.pipelineId, stepStatus.stepId);
      var rootJobCiId = _hpePipeline.HpePipeline.jobId(stepStatus.pipelineId, 'root');

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
        uri: uri,
        json: true,
        body: data
      };

      return _requestRx.RequestRx.put(this.request, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }, {
    key: 'reportPipelineTestResults',
    value: function reportPipelineTestResults(testResult) {
      var uri = _util2.default.format('%s/test-results/', this.workspaceUri());
      var jobCiId = _hpePipeline.HpePipeline.jobId(testResult.pipelineId, testResult.stepId);

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
        uri: uri,
        'content-type': 'application/xml',
        body: data
      };

      return _requestRx.RequestRx.post(this.request, options).map(function (response) {
        if (response.statusCode !== 202) {
          throw new _hpeError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }], [{
    key: 'createSession',
    value: function createSession(config) {
      var authCookies = _request2.default.jar();
      var authRequest = _request2.default.defaults({
        jar: authCookies
      });

      var options = {
        uri: _util2.default.format('%s/authentication/sign_in/', config.serverUrl),
        json: true,
        body: {
          user: config.user,
          password: config.password
        }
      };

      return _requestRx.RequestRx.post(authRequest, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeError2.default(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        var csrfToken = (0, _lodash2.default)(authCookies.getCookies(config.serverUrl)).find(function (cookie) {
          return cookie.key === 'HPSSO_COOKIE_CSRF';
        }).value;

        var hpeApi = new HpeApi();
        hpeApi.request = authRequest.defaults({
          headers: {
            'HPSSO-HEADER-CSRF': csrfToken
          }
        });

        _lodash2.default.assign(hpeApi, config);
        return hpeApi;
      });
    }
  }]);

  return HpeApi;
}();

exports.HpeApi = HpeApi;