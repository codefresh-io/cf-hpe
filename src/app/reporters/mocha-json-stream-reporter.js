import R from 'ramda';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

const hpeTestResultMapping = {
  pass: 'Passed',
  fail: 'Failed',
};

export const MochaJsonStreamReporter = {};

MochaJsonStreamReporter.create = (buildStepObservable, buildSession) =>
  buildStepObservable
    .filter(step => R.contains(step.stepId, ['unit-test-script']))
    .flatMap(step => BuildStep
      .childStepLogs(step)
      .filter(R.test(/^\["(pass|fail)",{"title":.+}]\s+$/))
      .map(JSON.parse)
      .map(testResult => HpeApiTestResult.create(
        testResult[1].fullTitle,
        step.startTime,
        testResult[1].duration,
        hpeTestResultMapping[testResult[0]],
        testResult[1].err,
        testResult[1].err,
        testResult[1].stack))
      .flatMap(hpeApiTestResult => BuildSession.reportBuildPipelineTestResults(
        buildSession,
        step,
        [hpeApiTestResult])));
