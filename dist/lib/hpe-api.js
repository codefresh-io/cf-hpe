'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HpeApi = undefined;

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

var _hpeApiError = require('./hpe-api-error');

var _hpeApiPipeline = require('./hpe-api-pipeline');

var _hpeApiConfig = require('./hpe-api-config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HpeApi = exports.HpeApi = function () {
  function HpeApi() {
    _classCallCheck(this, HpeApi);
  }

  _createClass(HpeApi, null, [{
    key: 'connect',
    value: function connect() {
      var jar = _request2.default.jar();
      var signInRequest = _request2.default.defaults({ jar: jar });
      var options = {
        uri: _util2.default.format('%s/authentication/sign_in/', _hpeApiConfig.hpeApiConfig.hpeServerUrl),
        json: true,
        body: {
          user: _hpeApiConfig.hpeApiConfig.hpeUser,
          password: _hpeApiConfig.hpeApiConfig.hpePassword
        }
      };

      return _requestRx.RequestRx.post(signInRequest, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        var csrfToken = (0, _lodash2.default)(jar.getCookies(_hpeApiConfig.hpeApiConfig.hpeServerUrl)).find(function (cookie) {
          return cookie.key === 'HPSSO_COOKIE_CSRF';
        }).value;

        return {
          hpeApiConfig: _hpeApiConfig.hpeApiConfig,
          request: signInRequest.defaults({
            headers: {
              'HPSSO-HEADER-CSRF': csrfToken
            }
          })
        };
      });
    }
  }, {
    key: '_getWorkspaceUri',
    value: function _getWorkspaceUri(session) {
      return _util2.default.format('%s/api/shared_spaces/%s/workspaces/%s', session.hpeApiConfig.hpeServerUrl, session.hpeApiConfig.hpeSharedSpace, session.hpeApiConfig.hpeWorkspace);
    }
  }, {
    key: 'findCiServer',
    value: function findCiServer(session, instanceId) {
      var options = {
        uri: _util2.default.format('%s/ci_servers/', HpeApi.getWorkspaceUri(session)),
        json: true
      };

      return _requestRx.RequestRx.get(session.request, options).flatMap(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
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
        uri: _util2.default.format('%s/ci_servers/', HpeApi.getWorkspaceUri(session)),
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx.RequestRx.post(session.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'createPipeline',
    value: function createPipeline(session, pipeline) {
      var pipelineJobs = _hpeApiPipeline.HpeApiPipeline.jobs(pipeline.id);
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
        uri: _util2.default.format('%s/pipelines/', HpeApi.getWorkspaceUri(session)),
        json: true,
        body: {
          data: [data]
        }
      };

      return _requestRx.RequestRx.post(session.request, options).map(function (response) {
        if (response.statusCode !== 201) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body.data[0], data);
      });
    }
  }, {
    key: 'reportPipelineStepStatus',
    value: function reportPipelineStepStatus(session, stepStatus) {
      var jobCiId = _hpeApiPipeline.HpeApiPipeline.jobId(stepStatus.pipelineId, stepStatus.stepId);
      var rootJobCiId = _hpeApiPipeline.HpeApiPipeline.jobId(stepStatus.pipelineId, 'pipeline');

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
        uri: _util2.default.format('%s/analytics/ci/builds/', HpeApi.getWorkspaceUri(session)),
        json: true,
        body: data
      };

      return _requestRx.RequestRx.put(session.request, options).map(function (response) {
        if (response.statusCode !== 200) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }, {
    key: 'reportPipelineTestResults',
    value: function reportPipelineTestResults(session, testResult) {
      var jobCiId = _hpeApiPipeline.HpeApiPipeline.jobId(testResult.pipelineId, testResult.stepId);
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
        uri: _util2.default.format('%s/test-results/', HpeApi.getWorkspaceUri(session)),
        'content-type': 'application/xml',
        body: data
      };

      return _requestRx.RequestRx.post(session.request, options).map(function (response) {
        if (response.statusCode !== 202) {
          throw new _hpeApiError.HpeApiError(response.statusCode, JSON.stringify(response.body, null, 2));
        }

        return _lodash2.default.assign({}, response.body, data);
      });
    }
  }]);

  return HpeApi;
}();
//# sourceMappingURL=data:application/json;base64,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LEVBQWlDO0FBQy9CLGdCQUFNLDZCQUNKLFNBQVMsVUFETCxFQUVKLEtBQUssU0FBTCxDQUFlLFNBQVMsSUFBeEIsRUFBOEIsSUFBOUIsRUFBb0MsQ0FBcEMsQ0FGSSxDQUFOO0FBR0Q7O0FBRUQsZUFBTyxpQkFBRSxNQUFGLENBQVMsRUFBVCxFQUFhLFNBQVMsSUFBdEIsRUFBNEIsSUFBNUIsQ0FBUDtBQUNELE9BVkksQ0FBUDtBQVdEIiwiZmlsZSI6ImxpYi9ocGUtYXBpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBSeCBmcm9tICdyeCc7XG5pbXBvcnQgVXRpbCBmcm9tICd1dGlsJztcbmltcG9ydCBYbWwyanMgZnJvbSAneG1sMmpzJztcbmltcG9ydCByZXF1ZXN0IGZyb20gJ3JlcXVlc3QnO1xuaW1wb3J0IHsgUmVxdWVzdFJ4IH0gZnJvbSAnbGliL3JlcXVlc3QtcngnO1xuaW1wb3J0IHsgSHBlQXBpRXJyb3IgfSBmcm9tICdsaWIvaHBlLWFwaS1lcnJvcic7XG5pbXBvcnQgeyBIcGVBcGlQaXBlbGluZSB9IGZyb20gJ2xpYi9ocGUtYXBpLXBpcGVsaW5lJztcbmltcG9ydCB7IGhwZUFwaUNvbmZpZyB9IGZyb20gJy4vaHBlLWFwaS1jb25maWcnO1xuXG5leHBvcnQgY2xhc3MgSHBlQXBpIHtcblxuICBzdGF0aWMgY29ubmVjdCgpIHtcbiAgICBjb25zdCBqYXIgPSByZXF1ZXN0LmphcigpO1xuICAgIGNvbnN0IHNpZ25JblJlcXVlc3QgPSByZXF1ZXN0LmRlZmF1bHRzKHsgamFyIH0pO1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICB1cmk6IFV0aWwuZm9ybWF0KCclcy9hdXRoZW50aWNhdGlvbi9zaWduX2luLycsIGhwZUFwaUNvbmZpZy5ocGVTZXJ2ZXJVcmwpLFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgdXNlcjogaHBlQXBpQ29uZmlnLmhwZVVzZXIsXG4gICAgICAgIHBhc3N3b3JkOiBocGVBcGlDb25maWcuaHBlUGFzc3dvcmQsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICByZXR1cm4gUmVxdWVzdFJ4XG4gICAgICAucG9zdChzaWduSW5SZXF1ZXN0LCBvcHRpb25zKVxuICAgICAgLm1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSHBlQXBpRXJyb3IoXG4gICAgICAgICAgICByZXNwb25zZS5zdGF0dXNDb2RlLFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuYm9keSwgbnVsbCwgMikpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3NyZlRva2VuID1cbiAgICAgICAgICBfKGphci5nZXRDb29raWVzKGhwZUFwaUNvbmZpZy5ocGVTZXJ2ZXJVcmwpKVxuICAgICAgICAgICAgLmZpbmQoY29va2llID0+IGNvb2tpZS5rZXkgPT09ICdIUFNTT19DT09LSUVfQ1NSRicpXG4gICAgICAgICAgICAudmFsdWU7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBocGVBcGlDb25maWcsXG4gICAgICAgICAgcmVxdWVzdDogc2lnbkluUmVxdWVzdC5kZWZhdWx0cyh7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICdIUFNTTy1IRUFERVItQ1NSRic6IGNzcmZUb2tlbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBfZ2V0V29ya3NwYWNlVXJpKHNlc3Npb24pIHtcbiAgICByZXR1cm4gVXRpbC5mb3JtYXQoXG4gICAgICAnJXMvYXBpL3NoYXJlZF9zcGFjZXMvJXMvd29ya3NwYWNlcy8lcycsXG4gICAgICBzZXNzaW9uLmhwZUFwaUNvbmZpZy5ocGVTZXJ2ZXJVcmwsXG4gICAgICBzZXNzaW9uLmhwZUFwaUNvbmZpZy5ocGVTaGFyZWRTcGFjZSxcbiAgICAgIHNlc3Npb24uaHBlQXBpQ29uZmlnLmhwZVdvcmtzcGFjZSk7XG4gIH1cblxuICBzdGF0aWMgZmluZENpU2VydmVyKHNlc3Npb24sIGluc3RhbmNlSWQpIHtcbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgdXJpOiBVdGlsLmZvcm1hdCgnJXMvY2lfc2VydmVycy8nLCBIcGVBcGkuX2dldFdvcmtzcGFjZVVyaShzZXNzaW9uKSksXG4gICAgICBqc29uOiB0cnVlLFxuICAgIH07XG5cbiAgICByZXR1cm4gUmVxdWVzdFJ4XG4gICAgICAuZ2V0KHNlc3Npb24ucmVxdWVzdCwgb3B0aW9ucylcbiAgICAgIC5mbGF0TWFwKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgIHRocm93IG5ldyBIcGVBcGlFcnJvcihcbiAgICAgICAgICAgIHJlc3BvbnNlLnN0YXR1c0NvZGUsXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5ib2R5LCBudWxsLCAyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUnguT2JzZXJ2YWJsZVxuICAgICAgICAgIC5mcm9tKHJlc3BvbnNlLmJvZHkuZGF0YSlcbiAgICAgICAgICAuZmlyc3QoY2lTZXJ2ZXIgPT4gY2lTZXJ2ZXIuaW5zdGFuY2VfaWQgPT09IGluc3RhbmNlSWQsIG51bGwsIG51bGwpO1xuICAgICAgfSk7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlQ2lTZXJ2ZXIoc2Vzc2lvbiwgc2VydmVyKSB7XG4gICAgY29uc3QgZGF0YSA9IHtcbiAgICAgIGluc3RhbmNlX2lkOiBzZXJ2ZXIuaW5zdGFuY2VJZCxcbiAgICAgIG5hbWU6IHNlcnZlci5uYW1lLFxuICAgICAgdXJsOiAnaHR0cDovL2NvZGVmcmVzaC5pby8nLFxuICAgICAgc2VydmVyX3R5cGU6ICdDb2RlZnJlc2gnLFxuICAgIH07XG5cbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgdXJpOiBVdGlsLmZvcm1hdCgnJXMvY2lfc2VydmVycy8nLCBIcGVBcGkuX2dldFdvcmtzcGFjZVVyaShzZXNzaW9uKSksXG4gICAgICBqc29uOiB0cnVlLFxuICAgICAgYm9keToge1xuICAgICAgICBkYXRhOiBbZGF0YV0sXG4gICAgICB9LFxuICAgIH07XG5cbiAgICByZXR1cm4gUmVxdWVzdFJ4XG4gICAgICAucG9zdChzZXNzaW9uLnJlcXVlc3QsIG9wdGlvbnMpXG4gICAgICAubWFwKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMSkge1xuICAgICAgICAgIHRocm93IG5ldyBIcGVBcGlFcnJvcihcbiAgICAgICAgICAgIHJlc3BvbnNlLnN0YXR1c0NvZGUsXG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5ib2R5LCBudWxsLCAyKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gXy5hc3NpZ24oe30sIHJlc3BvbnNlLmJvZHkuZGF0YVswXSwgZGF0YSk7XG4gICAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVQaXBlbGluZShzZXNzaW9uLCBwaXBlbGluZSkge1xuICAgIGNvbnN0IHBpcGVsaW5lSm9icyA9IEhwZUFwaVBpcGVsaW5lLmpvYnMocGlwZWxpbmUuaWQpO1xuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICBuYW1lOiBwaXBlbGluZS5uYW1lLFxuICAgICAgcm9vdF9qb2JfY2lfaWQ6IHBpcGVsaW5lSm9ic1swXS5qb2JDaUlkLFxuICAgICAgY2lfc2VydmVyOiB7XG4gICAgICAgIHR5cGU6ICdjaV9zZXJ2ZXInLFxuICAgICAgICBpZDogcGlwZWxpbmUuc2VydmVySWQsXG4gICAgICB9LFxuICAgICAgam9iczogcGlwZWxpbmVKb2JzLFxuICAgIH07XG5cbiAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgdXJpOiBVdGlsLmZvcm1hdCgnJXMvcGlwZWxpbmVzLycsIEhwZUFwaS5fZ2V0V29ya3NwYWNlVXJpKHNlc3Npb24pKSxcbiAgICAgIGpzb246IHRydWUsXG4gICAgICBib2R5OiB7XG4gICAgICAgIGRhdGE6IFtkYXRhXSxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHJldHVybiBSZXF1ZXN0UnhcbiAgICAgIC5wb3N0KHNlc3Npb24ucmVxdWVzdCwgb3B0aW9ucylcbiAgICAgIC5tYXAocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSAhPT0gMjAxKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEhwZUFwaUVycm9yKFxuICAgICAgICAgICAgcmVzcG9uc2Uuc3RhdHVzQ29kZSxcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLmJvZHksIG51bGwsIDIpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBfLmFzc2lnbih7fSwgcmVzcG9uc2UuYm9keS5kYXRhWzBdLCBkYXRhKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHJlcG9ydFBpcGVsaW5lU3RlcFN0YXR1cyhzZXNzaW9uLCBzdGVwU3RhdHVzKSB7XG4gICAgY29uc3Qgam9iQ2lJZCA9IEhwZUFwaVBpcGVsaW5lLmpvYklkKHN0ZXBTdGF0dXMucGlwZWxpbmVJZCwgc3RlcFN0YXR1cy5zdGVwSWQpO1xuICAgIGNvbnN0IHJvb3RKb2JDaUlkID0gSHBlQXBpUGlwZWxpbmUuam9iSWQoc3RlcFN0YXR1cy5waXBlbGluZUlkLCAncGlwZWxpbmUnKTtcblxuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICBzZXJ2ZXJDaUlkOiBzdGVwU3RhdHVzLnNlcnZlckluc3RhbmNlSWQsXG4gICAgICBqb2JDaUlkLFxuICAgICAgYnVpbGRDaUlkOiBzdGVwU3RhdHVzLmJ1aWxkSWQsXG4gICAgICBidWlsZE5hbWU6IHN0ZXBTdGF0dXMuYnVpbGROYW1lLFxuICAgICAgc3RhcnRUaW1lOiBzdGVwU3RhdHVzLnN0YXJ0VGltZSxcbiAgICAgIGR1cmF0aW9uOiBzdGVwU3RhdHVzLmR1cmF0aW9uLFxuICAgICAgc3RhdHVzOiBzdGVwU3RhdHVzLnN0YXR1cyxcbiAgICAgIHJlc3VsdDogc3RlcFN0YXR1cy5yZXN1bHQsXG4gICAgfTtcblxuICAgIGlmIChqb2JDaUlkICE9PSByb290Sm9iQ2lJZCkge1xuICAgICAgZGF0YS5jYXVzZXMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBqb2JDaUlkOiByb290Sm9iQ2lJZCxcbiAgICAgICAgICBidWlsZENpSWQ6IHN0ZXBTdGF0dXMuYnVpbGRJZCxcbiAgICAgICAgfSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIHVyaTogVXRpbC5mb3JtYXQoJyVzL2FuYWx5dGljcy9jaS9idWlsZHMvJywgSHBlQXBpLl9nZXRXb3Jrc3BhY2VVcmkoc2Vzc2lvbikpLFxuICAgICAganNvbjogdHJ1ZSxcbiAgICAgIGJvZHk6IGRhdGEsXG4gICAgfTtcblxuICAgIHJldHVybiBSZXF1ZXN0UnhcbiAgICAgIC5wdXQoc2Vzc2lvbi5yZXF1ZXN0LCBvcHRpb25zKVxuICAgICAgLm1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSHBlQXBpRXJyb3IoXG4gICAgICAgICAgICByZXNwb25zZS5zdGF0dXNDb2RlLFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuYm9keSwgbnVsbCwgMikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uYXNzaWduKHt9LCByZXNwb25zZS5ib2R5LCBkYXRhKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHJlcG9ydFBpcGVsaW5lVGVzdFJlc3VsdHMoc2Vzc2lvbiwgdGVzdFJlc3VsdCkge1xuICAgIGNvbnN0IGpvYkNpSWQgPSBIcGVBcGlQaXBlbGluZS5qb2JJZCh0ZXN0UmVzdWx0LnBpcGVsaW5lSWQsIHRlc3RSZXN1bHQuc3RlcElkKTtcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IFhtbDJqcy5CdWlsZGVyKCk7XG4gICAgY29uc3QgZGF0YSA9IGJ1aWxkZXIuYnVpbGRPYmplY3Qoe1xuICAgICAgdGVzdF9yZXN1bHQ6IHtcbiAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAkOiB7XG4gICAgICAgICAgICBzZXJ2ZXJfaWQ6IHRlc3RSZXN1bHQuc2VydmVySW5zdGFuY2VJZCxcbiAgICAgICAgICAgIGpvYl9pZDogam9iQ2lJZCxcbiAgICAgICAgICAgIGpvYl9uYW1lOiBqb2JDaUlkLFxuICAgICAgICAgICAgYnVpbGRfaWQ6IHRlc3RSZXN1bHQuYnVpbGRJZCxcbiAgICAgICAgICAgIGJ1aWxkX25hbWU6IHRlc3RSZXN1bHQuYnVpbGRJZCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB0ZXN0X3J1bnM6IHtcbiAgICAgICAgICB0ZXN0X3J1bjoge1xuICAgICAgICAgICAgJDoge1xuICAgICAgICAgICAgICBuYW1lOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLnRlc3ROYW1lLFxuICAgICAgICAgICAgICBzdGFydGVkOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLnN0YXJ0ZWQsXG4gICAgICAgICAgICAgIGR1cmF0aW9uOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLmR1cmF0aW9uLFxuICAgICAgICAgICAgICBzdGF0dXM6IHRlc3RSZXN1bHQudGVzdFJ1bnNbMF0uc3RhdHVzLFxuICAgICAgICAgICAgICBtb2R1bGU6IHRlc3RSZXN1bHQudGVzdFJ1bnNbMF0ubW9kdWxlLFxuICAgICAgICAgICAgICBwYWNrYWdlOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLnBhY2thZ2UsXG4gICAgICAgICAgICAgIGNsYXNzOiB0ZXN0UmVzdWx0LnRlc3RSdW5zWzBdLmNsYXNzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICB1cmk6IFV0aWwuZm9ybWF0KCclcy90ZXN0LXJlc3VsdHMvJywgSHBlQXBpLl9nZXRXb3Jrc3BhY2VVcmkoc2Vzc2lvbikpLFxuICAgICAgJ2NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi94bWwnLFxuICAgICAgYm9keTogZGF0YSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIFJlcXVlc3RSeFxuICAgICAgLnBvc3Qoc2Vzc2lvbi5yZXF1ZXN0LCBvcHRpb25zKVxuICAgICAgLm1hcChyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgSHBlQXBpRXJyb3IoXG4gICAgICAgICAgICByZXNwb25zZS5zdGF0dXNDb2RlLFxuICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuYm9keSwgbnVsbCwgMikpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIF8uYXNzaWduKHt9LCByZXNwb25zZS5ib2R5LCBkYXRhKTtcbiAgICAgIH0pO1xuICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
