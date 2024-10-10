export class Planner {
    constructor(actions) {
        this.actions = actions;
    }

    setGoal(goal) {
        this.goal = goal;
    }

    generatePlan(worldState) {
        // set contains traversible nodes
        let traversible = [];

        // Initial state
        let startingNode = {
            state: { ...worldState },
            actionCost: 0,
            heuristic: this.heuristic(worldState, this.goal),
            actions: []
        };

        traversible.push(startingNode);

        while (traversible.length > 0) {
            // Get the node with the lowest action cost and heuristic
            traversible.sort((nodeA, nodeB) => (nodeA.actionCost + nodeA.heuristic) - (nodeB.actionCost + nodeB.heuristic));
            let currentNode = traversible.shift();

            if (currentNode.actionCost > 10) {
                return [];
            }

            // check if we've achieved the goal
            console.log("currentNode:");
            console.log(currentNode);
            if (this.goal.isAchieved(currentNode.state)) {
                return currentNode.actionIds;
            }

            // Iterate over actions 
            for (const [name, action] of Object.entries(this.actions)) {
                // check that we dont go over three actions
                if ((currentNode.actionCost % 3) + action.numberOfActions > 3)
                    continue;

                // check preconditions
                if (!action.canExecute(currentNode.state))
                    continue;
                
                // apply the next action to get the new state
                let newState = action.applyEffects(currentNode.state, currentNode.actionCost);

                // next node
                let nextNode = {
                    state: newState,
                    actionCost: currentNode.actionCost + action.numberOfActions,
                    heuristic: this.heuristic(newState, this.goal),
                    actions: [...currentNode.actions, action.name]
                }
                traversible.push(nextNode);
            }
        }

        return [];
    }

    // check the number of differing world state values
    heuristic(worldState, goal) {
        let score = 0;
        for (let desiredState of goal.desiredStates) {
            let worldVal = worldState[desiredState['key']];
            if (!goal.doesStateFulfillGoal(desiredState, worldVal))
                score++;
        }

        return score;
    }
}