import _ from 'lodash';
import util from 'util';

const _pipelineSteps = [
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

class HpeApiPipeline {
  static steps() {
    return _pipelineSteps;
  }

  static jobId(pipelineId, stepId) {
    return util.format('%s-%s', pipelineId, stepId);
  }

  static jobs(pipelineId) {
    return _(HpeApiPipeline.steps())
      .map(step => {
        const result = {
          jobCiId: HpeApiPipeline.jobId(pipelineId, step.id),
          name: step.name,
        };

        return result;
      })
      .value();
  }
}

export default HpeApiPipeline;
