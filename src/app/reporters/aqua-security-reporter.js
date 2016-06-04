import R from 'ramda';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

const aquaResults = require('./aqua.json');

export const AquaSecurityReporter = {};

AquaSecurityReporter.create = (buildStepObservable, buildSession) =>
  buildStepObservable
    .filter(step => R.contains(step.stepId, ['security-validation']))
    .flatMap(() => aquaResults)
    .map(JSON.parse)
    .map(testResult => HpeApiTestResult.create(
      testResult[1].fullTitle,
      step.startTime,
      testResult[1].duration,
      hpeTestResultMapping[testResult[0]],
      testResult[1].err,
      testResult[1].err,
      testResult[1].stack))
    .flatMap(hpeApiTestResult => BuildSession.reportBuildPipelineTestResults(
      buildSession,
      step,
      [hpeApiTestResult]));
