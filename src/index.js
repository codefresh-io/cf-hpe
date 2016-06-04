import R from 'ramda';
import { HpeApiTestResult } from 'cf-hpe-api';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { CommonPipelineReporter } from 'app/reporters/common-pipeline-reporter';
import { MochaJsonStreamReporter } from 'app/reporters/mocha-json-stream-reporter';

Build.buildsFromFirebase().flatMap(build =>
  BuildSession.createForBuild(build).map(buildSession => {
    const buildStepObservable = BuildStep.stepsFromBuild(build).share();
    CommonPipelineReporter.create(buildStepObservable, buildSession).subscribe();
    MochaJsonStreamReporter.create(buildStepObservable, buildSession).subscribe();
    return {};
  })).subscribe();
