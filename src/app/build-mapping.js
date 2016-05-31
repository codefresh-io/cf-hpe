import R from 'ramda';

export const HpeStatusMapping = {
  success: 'success',
  error: 'failure',
  terminated: 'aborted',
};

HpeStatusMapping.isStatus = (status) => R.has(status, HpeStatusMapping);

export const HpePipelineStepMapping = {
  'Building Docker Image': 'build-dockerfile',
  'Running Unit Tests': 'unit-test-script',
  'Running Integration Tests': 'integration-test-script',
  'security-validation': 'security-validation',
  'Running Deploy script': 'deploy-script',
};

HpePipelineStepMapping.isPipelineStep = (name) => R.has(name, HpePipelineStepMapping);
