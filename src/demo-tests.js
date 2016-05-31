import R from 'ramda';
import Rx from 'rx';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

// const hpeTestResultMapping = {
//  success: 'Passed',
//  failure: 'Failed',
//  terminated: 'Failed',
// };

export const DemoTests = {};

DemoTests.testResults = [
  {
    name: 'Should pass test 1',
    status: 'Passed',
  },
  {
    name: 'Should pass test 2',
    status: 'Failed',
    errorType: 'exception',
    errorMessage: 'test failed',
    errorStackTrace: 'test failed callstack',
  },
];

DemoTests.reportBuildPipelineTestResults = (buildStepObservable, buildSession) => {
  buildStepObservable
    .filter(step => R.contains(step.stepId, ['unit-test-script']))
    .flatMap(step => Rx.Observable
      .from(DemoTests.testResults)
      .map(testResult => HpeApiTestResult.create(
        testResult.name,
        step.startTime,
        step.duration,
        testResult.status,
        buildSession.build.serviceName,
        buildSession.build.serviceName,
        buildSession.build.serviceName,
        testResult.errorType,
        testResult.errorMessage,
        testResult.errorStackTrace))
      .flatMap(hpeApiTestResult => BuildSession.reportBuildPipelineTestResults(
        buildSession,
        step,
        [hpeApiTestResult])))
    .subscribe();
};
