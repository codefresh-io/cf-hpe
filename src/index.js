import './config.env';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';

const reportBuildPipelineStepStatus = (build, buildSession) => {
  BuildStep
    .steps(build)
    .flatMap(step =>
      BuildSession.reportBuildPipelineStepStatus(buildSession, step))
    .subscribe();
};

Build.builds().flatMap(build =>
  BuildSession.create(build).map(buildSession =>
    reportBuildPipelineStepStatus(build, buildSession)))
  .subscribe();
