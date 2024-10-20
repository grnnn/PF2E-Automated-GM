import { StateCheck, WorldState } from "./structs.ts";

export class Goal {
    public name : string;                   // Name of the goal (e.g., "kill enemy")
    public desiredStates : StateCheck[];    // The states that represents achieving this goal

    constructor(name : string, desiredStates : StateCheck[]) {
      this.name = name;                     
      this.desiredStates = desiredStates;   
    }
  
    isAchieved(worldState : WorldState) : boolean {
        for (const desiredState of this.desiredStates) {
            let worldVal = worldState[desiredState.key];
            if (!this.doesStateFulfillGoal(desiredState, worldVal))
                return false;
        }

        return true;
    }

    distanceFromGoal(worldState : WorldState) : number {
        let score = 0;
        for (let desiredState of this.desiredStates) {
            let worldVal = worldState[desiredState.key];
            let stateVal = desiredState.val;
            let penalty = desiredState.penalty || 10;
            if (typeof worldVal === 'number' && typeof stateVal === 'number') {
                score += Math.abs(worldVal - stateVal);
            }
            if (typeof worldVal === 'boolean' && typeof stateVal === 'boolean') {
                score += worldVal === stateVal ? 0 : penalty;
            }
            if (typeof worldVal === 'string' && typeof stateVal === 'string') {
                score += worldVal === stateVal ? 0 : penalty;
            }
        }

        return score;
    }

    doesStateFulfillGoal(desiredState : StateCheck, worldVal: string | number | boolean) : boolean {
        switch (desiredState.op) {
            case '=':
            case '==':
            case '===':
                if (worldVal === desiredState.val) return true;
                break;
            case '!=':
            case '!==':
                if (worldVal !== desiredState.val) return true;
                break;
            case '>':
                if (worldVal > desiredState.val) return true;
                break;
            case '>=':
                if (worldVal >= desiredState.val) return true;
                break;
            case '<':
                if (worldVal < desiredState.val) return true;
                break;
            case '<=':
                if (worldVal <= desiredState.val) return true;
                break;
            default:
                return false;
        }

        return false;
    }
}