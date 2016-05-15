import './config.env';
import Build from 'app/build';
import BuildStep from 'app/build-step';
import HpeBuildSession from 'app/hpe-build-session';

Build.builds().flatMap(build =>
  HpeBuildSession.openSession(build).flatMap(buildSession =>
    BuildStep.steps(build).flatMap(step =>
      HpeBuildSession.reportStepStatus(buildSession, step))))
  .subscribe();
