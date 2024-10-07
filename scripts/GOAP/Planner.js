import { Action } from './Action';
import { Goal } from './Goal';

export class Planner {
    constructor(actions) {
        this.actions = actions;     // actions available to the owning agent
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
            heuristic: heuristic(worldState, this.goal),
            actionIds: [],
        };

        traversible.push(startingNode);

        while (traversible.length > 0) {
            // Get the node with the lowest action cost and heuristic
            traversible.sort((nodeA, nodeB) => (nodeA.actionCost + nodeA.heuristic) - (nodeB.actionCost + nodeB.heuristic));
            let currentNode = traversible.shift();

            // check if we've achieved the goal
            if (this.goal.isAchieved(currentNode.state)) {
                return currentNode.actionIds;
            }

            // Iterate over actions 
            for (let action of this.actions) {
                // check that we dont go over three actions
                if ((currentNode.actionCost % 3) + action.actionCost > 3)
                    continue;

                // check preconditions
                if (!action.canExecute(currentNode.state))
                    continue;
                
                // apply the next action to get the new state
                let newState = action.applyEffects({ ...currentNode.state });

                // next node
                let nextNode = {
                    state: newState,
                    actionCost: currentNode.actionCost + action.actionCost,
                    heuristic: this.heuristic(newState, goal),
                    actionIds: [...currentNode.actionIds, action.id]
                }
                traversible.push(nextNode);
            }
        }
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