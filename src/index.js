import './config.env';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';

Build.builds().flatMap(build =>
  BuildSession.openBuildSession(build).flatMap(buildSession =>
    BuildStep.steps(build).flatMap(step =>
      BuildSession.reportStepStatus(buildSession, step))))
  .subscribe();
