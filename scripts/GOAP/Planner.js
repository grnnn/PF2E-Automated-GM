import { Action } from './Action';
import { Goal } from './Goal';

export class Planner {
    constructor(actions, goal) {
        this.actions = actions;     // actions available to the owning agent
        this.goal = goal;           // desired world state
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
            heuristic: 0,
            actions: []
        };
    }
}