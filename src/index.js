import './config.env';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

const reportBuildPipelineStepStatus = (build, buildSession) => {
  BuildStep
    .steps(build)
    .flatMap(step => BuildSession.reportBuildPipelineStepStatus(buildSession, step))
    .subscribe();
};

const reportBuildPipelineTestResults = (build, buildSession) => {
  const testResult = HpeApiTestResult.create(
    'Should pass integration test #2',
    Date.now(),
    1000,
    'Failed',
    'cf-hpe',
    'test-2',
    'hpe');

  BuildStep
    .steps(build)
    .filter(step => step.stepId === 'unit-test-script')
    .flatMap(step => BuildSession.reportBuildPipelineTestResults(buildSession, step, [testResult]))
    .subscribe();
};

Build.builds().flatMap(build =>
  BuildSession.create(build).map(buildSession => {
    reportBuildPipelineStepStatus(build, buildSession);
    reportBuildPipelineTestResults(build, buildSession);
    return null;
  }))
  .subscribe();
