import R from 'ramda';
import { DemoTests } from './demo-tests';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

const hpeTestResultMapping = {
  success: 'Passed',
  failure: 'Failed',
  terminated: 'Failed',
};

const reportBuildPipelineStepStatus = (buildStepObservable, buildSession) => {
  buildStepObservable
    .flatMap(step => BuildSession.reportBuildPipelineStepStatus(buildSession, step))
    .subscribe();
};

const reportBuildPipelineTestResults = (buildStepObservable, buildSession) => {
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
    })
    .subscribe();
};

Build.buildsFromFirebase().flatMap(build =>
  BuildSession.createForBuild(build).map(buildSession => {
    const buildStepObservable = BuildStep.stepsFromBuild(build).share();
    reportBuildPipelineStepStatus(buildStepObservable, buildSession);
    DemoTests.reportBuildPipelineTestResults(buildStepObservable, buildSession);
    return null;
  }))
  .subscribe();
