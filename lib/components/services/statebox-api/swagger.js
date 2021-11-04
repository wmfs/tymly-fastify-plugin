module.exports = {
  startExecution: {
    description: 'Start a new Statebox execution',
    body: {
      type: 'object',
      properties: {
        stateMachineName: {
          type: 'string',
          description: 'State machine name'
        },
        input: {
          type: 'object',
          description: 'Input'
        },
        options: {
          type: 'object',
          description: 'Options'
        }
      }
    }
  },
  describeExecution: {
    description: 'Describe an existing Statebox execution',
    params: {
      type: 'object',
      properties: {
        executionName: {
          type: 'string',
          description: 'Execution name'
        }
      }
    }
  },
  executionAction: {
    description: 'Perform an action on an existing Statebox execution',
    params: {
      type: 'object',
      properties: {
        executionName: {
          type: 'string',
          description: 'Execution name'
        }
      }
    },
    body: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform on Statebox execution',
          enum: [
            'SendTaskSuccess',
            'SendTaskHeartbeat',
            'SendTaskRevivification',
            'WaitUntilStoppedRunning'
          ]
        }
      }
    }
  },
  stopExecution: {
    description: 'Stop an existing Statebox execution',
    params: {
      type: 'object',
      properties: {
        executionName: {
          type: 'string',
          description: 'Execution name'
        }
      }
    }
  }
}
