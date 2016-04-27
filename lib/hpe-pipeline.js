'use strict';
import _ from 'lodash';

const pipelineSteps = [
  {
    id: 'root',
    name: 'Codefresh Build'
  },
  {
    id: 'clone-repository',
    name: 'Clone Repository'
  },
  {
    id: 'build-dockerfile',
    name: 'Build Dockerfile'
  },
  {
    id: 'unit-test-script',
    name: 'Unit Test Script'
  },
  {
    id: 'push-docker-registry',
    name: 'Push to Docker Registry'
  },
  {
    id: 'integration-test-script',
    name: 'Integration Test Script'
  },
  {
    id: 'deploy-script',
    name: 'Deploy Script'
  }
];

class HpePipeline {
  static get steps() {
    return pipelineSteps;
  }

  static jobs(pipelineID) {
    return _(HpePipeline.steps)
      .map(step => {
        return {
          jobCiId: pipelineID + '-' + step.id,
          name: step.name
        };
      })
      .value();
  }
}

export default HpePipeline;
