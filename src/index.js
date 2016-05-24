import './config.env';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

const reportBuildPipelineStepStatus = (buildStepObservable, buildSession) => {
  buildStepObservable
    .flatMap(step => BuildSession.reportBuildPipelineStepStatus(buildSession, step))
    .subscribe();
};

const reportBuildPipelineTestResults = (buildStepObservable, buildSession) => {
  buildStepObservable
    .filter(step => step.stepId === 'unit-test-script')
    .flatMap(step => {
      const testResult = HpeApiTestResult.create(
        'Should pass integration test #2',
        Date.now(),
        1000,
        'Failed',
        'cf-hpe',
        'test-2',
        'hpe');

      return BuildSession.reportBuildPipelineTestResults(buildSession, step, [testResult]);
    })
    .subscribe();
};

Build.buildsFromFirebase().flatMap(build =>
  BuildSession.createForBuild(build).map(buildSession => {
    const buildStepObservable = BuildStep.stepsFromBuild(build).share();
    reportBuildPipelineStepStatus(buildStepObservable, buildSession);
    reportBuildPipelineTestResults(buildStepObservable, buildSession);
    return null;
  }))
  .subscribe();
