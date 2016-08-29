import R from 'ramda';
import Rx from 'rx';
import { Build } from 'app/build';
import { BuildStep } from 'app/build-step';
import { BuildSession } from 'app/build-session';
import { CommonPipelineReporter } from 'app/reporters/common-pipeline-reporter';
import { MochaJsonStreamReporter } from 'app/reporters/mocha-json-stream-reporter';
import { AquaSecurityReporter } from 'app/reporters/aqua-security-reporter';
import { Logger } from 'lib/logger';

const logger = Logger.create('CfHpe');

logger.info('Start with configuration.');

Build.buildsFromFirebase()
  .flatMap(build => {
    const buildError = (error) => logger.error(
      'Build error. account (%s) service (%s) build (%s) error (%s)',
      build.accountName,
      build.serviceName,
      build.buildId,
      error);

    return BuildSession.createForBuild(build)
      .map(buildSession => {
        const buildStepObservable = BuildStep.stepsFromBuild(build).share();

        CommonPipelineReporter
          .create(buildStepObservable, buildSession)
          .subscribe(R.noop, buildError);

        MochaJsonStreamReporter
          .create(buildStepObservable, buildSession)
          .subscribe(R.noop, buildError);

        AquaSecurityReporter
          .create(buildStepObservable, buildSession)
          .subscribe(R.noop, buildError);

        return {};
      });
  })
  .catch(error => Rx.Observable.just({})
    .doOnNext(logger.error('Build error. error (%s)', error)))
  .subscribe();
