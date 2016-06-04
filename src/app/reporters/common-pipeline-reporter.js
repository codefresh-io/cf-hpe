import { BuildSession } from 'app/build-session';

export const CommonPipelineReporter = {};

CommonPipelineReporter.create = (buildStepObservable, buildSession) =>
  buildStepObservable.flatMap(step => BuildSession.reportBuildPipelineStepStatus(
    buildSession,
    step));
