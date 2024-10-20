import { Action } from "./action.ts";
import { Goal } from "./goal.ts";
import { WorldState } from "./structs.ts";

interface Node {
    state: WorldState;
    actionCost: number;
    heuristic: number;
    actionNames: string[];
}

export class Planner {
    private actions: Action[];
    private goal : Goal;

    constructor(actions : Action[]) {
        this.actions = actions;
        this.goal = new Goal("default", []);
    }

    setGoal(goal : Goal) : void {
        this.goal = goal;
    }

    generatePlan(worldState : WorldState) : string[] {
        // set contains traversible nodes
        let traversible : Node[] = [];

        // Initial state
        let startingNode : Node = {
            state: { ...worldState },
            actionCost: 0,
            heuristic: this.heuristic(worldState, this.goal),
            actionNames: []
        };

        traversible.push(startingNode);

        while (traversible.length > 0) {
            // Get the node with the lowest action cost and heuristic
            traversible.sort((nodeA, nodeB) => (nodeA.actionCost + nodeA.heuristic) - (nodeB.actionCost + nodeB.heuristic));
            let current : Node = traversible.shift()!;

            if (current.actionCost > 10) {
                return [];
            }

            // check if we've achieved the goal
            if (this.goal.isAchieved(current.state)) {
                return current.actionNames;
            }

            // Iterate over actions 
            for (const action of this.actions) {
                // check that we dont go over three actions
                if ((current.actionCost % 3) + action.numberOfActions > 3)
                    continue;

                // check preconditions
                if (!action.canExecute(current.state))
                    continue;
                
                // apply the next action to get the new state
                let newState = action.applyEffects(current.state, current.actionCost);

                // next node
                let nextNode = {
                    state: newState,
                    actionCost: current.actionCost + action.numberOfActions,
                    heuristic: this.heuristic(newState, this.goal),
                    actionNames: [...current.actionNames, action.name]
                }
                traversible.push(nextNode);
            }
        }

        return [];
    }

    // check the number of differing world state values
    heuristic(worldState : WorldState, goal : Goal) : number {
        let score = 0;
        for (let desiredState of goal.desiredStates) {
            let worldVal = worldState[desiredState.key];
            if (!goal.doesStateFulfillGoal(desiredState, worldVal))
                score++;
        }

        return score;
    }
}