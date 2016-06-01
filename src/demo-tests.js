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
    name: 'Should fail when not passing any object',
    status: 'Passed',
  },
  {
    name: 'Should fail when not passing id',
    status: 'Failed',
    errorType: 'AssertionError',
    errorMessage: 'expected Error: add or update node failed failed because node.id param is missing to equal Errorr: add or update node failed failed because node.id param is missing',
    errorStackTrace: 'events.js:154\n   throw er; // Unhandled error event',
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
