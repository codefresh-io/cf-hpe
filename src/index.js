import R from 'ramda';
import Rx from 'rx';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';
import { Logger } from 'lib/logger';

const logger = Logger.create('CfHpe');

const hpeTestResultMapping = {
  pass: 'Passed',
  fail: 'Failed',
};

const reportBuildPipelineSteps = (buildStepObservable, buildSession) =>
  buildStepObservable.flatMap(step => BuildSession.reportBuildPipelineStepStatus(
    buildSession,
    step));

const reportBuildPipelineTests = (buildStepObservable, buildSession) =>
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
        buildSession.build.serviceName,
        buildSession.build.serviceName,
        buildSession.build.serviceName))
      .flatMap(hpeApiTestResult => BuildSession.reportBuildPipelineTestResults(
        buildSession,
        step,
        [hpeApiTestResult])));

Build.buildsFromFirebase().flatMap(build =>
  BuildSession.createForBuild(build).map(buildSession => {
    const buildStepObservable = BuildStep.stepsFromBuild(build).share();
    reportBuildPipelineSteps(buildStepObservable, buildSession).subscribe();
//    reportBuildPipelineTests(buildStepObservable, buildSession).subscribe();
    return {};
  })).subscribe();
