import R from 'ramda';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';
import { Logger } from 'lib/logger';

const logger = Logger.create('CfHpe');

const hpeTestResultMapping = {
  success: 'Passed',
  failure: 'Failed',
  terminated: 'Failed',
};

const reportBuildPipelineSteps = (buildStepObservable, buildSession) =>
  buildStepObservable.flatMap(step => BuildSession.reportBuildPipelineStepStatus(
    buildSession,
    step));

const reportBuildPipelineTests = (buildStepObservable, buildSession) =>
  buildStepObservable
    .filter(step => R.contains(step.stepId, ['unit-test-script']))
    .flatMap(step => BuildStep.childStepLogs(step))
    .doOnNext(line => logger.info(line));

const reportBuildPipelineTests2 = (buildStepObservable, buildSession) => {
  buildStepObservable
    .filter(step => R.contains(step.stepId, ['unit-test-script', 'integration-test-script']))
    .flatMap(step => {
      const testResult = HpeApiTestResult.create(
        step.stepId,
        step.startTime,
        step.duration,
        hpeTestResultMapping[step.result],
        buildSession.build.serviceName,
        buildSession.build.serviceName,
        buildSession.build.serviceName);

      return BuildSession.reportBuildPipelineTestResults(buildSession, step, [testResult]);
    });
};

Build.buildsFromFirebase().flatMap(build =>
  BuildSession.createForBuild(build).map(buildSession => {
    const buildStepObservable = BuildStep.stepsFromBuild(build).share();
    reportBuildPipelineSteps(buildStepObservable, buildSession).subscribe();
    reportBuildPipelineTests(buildStepObservable, buildSession).subscribe();
    return {};
  })).subscribe();
