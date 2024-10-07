export class Goal {
    constructor(name, desiredStates) {
      this.name = name;                     // Name of the goal (e.g., "kill enemy")
      this.desiredStates = desiredStates;   // The world states that represents achieving this goal
    }
  
    isAchieved(worldState) {
        // states formatted like:
        // { "key": "name", "val": 1, "op": ">"}
        for (const desiredState of this.desiredStates) {
            if (!('key' in desiredState) || !('val' in desiredState) || !('op' in desiredState))
                continue;
            
            let worldVal = worldState[state['key']];
            if (!this.doesStateFulfillGoal(desiredState, worldVal))
                return false;
        }

        return true;
    }

    doesStateFulfillGoal(desiredState, worldVal) {
        if (!('key' in desiredState) || !('val' in desiredState) || !('op' in desiredState))
            return false;

        switch (state['op']) {
            case '=':
            case '==':
            case '===':
                if (worldVal === state['val']) return true;
            case '!=':
            case '!==':
                if (worldVal !== state['val']) return true;
            case '>':
                if (worldVal > state['val']) return true;
            case '>=':
                if (worldVal >= state['val']) return true;
            case '<':
                if (worldVal < state['val']) return true;
            case '<=':
                if (worldVal <= state['val']) return true;
            default:
                return false;
        }
    }
}