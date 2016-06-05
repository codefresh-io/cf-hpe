import R from 'ramda';
import Rx from 'rx';
import { BuildSession } from 'app/build-session';
import { HpeApiTestResult } from 'cf-hpe-api';

const aquaResults = require('./aqua.json');
const hpeTestResultMapping = {
  medium: 'Passed',
  high: 'Failed',
};

export const AquaSecurityReporter = {};

AquaSecurityReporter.create = (buildStepObservable, buildSession) =>
  buildStepObservable
    .filter(step => R.contains(step.stepId, ['security-validation']))
    .flatMap(step => Rx.Observable.from(aquaResults.cves)
      .map(cve => HpeApiTestResult.create(
        cve.name,
        step.startTime,
        1000,
        hpeTestResultMapping[cve.severity],
        cve.type,
        cve.description,
        cve.file))
      .flatMap(hpeApiTestResult => BuildSession.reportBuildPipelineTestResults(
        buildSession,
        step,
        [hpeApiTestResult])));
