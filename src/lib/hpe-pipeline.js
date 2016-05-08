import _ from 'lodash';
import util from 'util';

const pipelineSteps = [
  {
    id: 'root',
    name: 'Codefresh Build',
  },
  {
    id: 'clone-repository',
    name: 'Clone Repository',
  },
  {
    id: 'build-dockerfile',
    name: 'Build Dockerfile',
  },
  {
    id: 'unit-test-script',
    name: 'Unit Test Script',
  },
  {
    id: 'push-docker-registry',
    name: 'Push to Docker Registry',
  },
  {
    id: 'integration-test-script',
    name: 'Integration Test Script',
  },
  {
    id: 'security-validation',
    name: 'Security Validation',
  },
  {
    id: 'deploy-script',
    name: 'Deploy Script',
  },
];

function steps() {
  return pipelineSteps;
}

function jobId(pipelineId, stepId) {
  return util.format('%s-%s', pipelineId, stepId);
}

function jobs(pipelineId) {
  return _(steps())
    .map(step => {
      const result = {
        jobCiId: jobId(pipelineId, step.id),
        name: step.name,
      };

      return result;
    })
    .value();
}

export default {
  steps,
  jobId,
  jobs,
};
