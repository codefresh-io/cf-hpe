import './config.env';
import Build from 'app/build';
import BuildStep from 'app/build-step';
import HpeBuildSession from 'app/hpe-build-session';

Build
  .builds()
  .flatMap(build =>
    HpeBuildSession
      .openSession(build)
      .flatMap(buildSession => {
        return BuildStep
          .steps(build)
          .flatMap(step => {
            return HpeBuildSession
              .reportStepStatus(buildSession, step);
          });
      }))
  .subscribe();
