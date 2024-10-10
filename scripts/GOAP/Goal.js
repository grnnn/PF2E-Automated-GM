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
            
            let worldVal = worldState[desiredState['key']];
            if (!this.doesStateFulfillGoal(desiredState, worldVal))
                return false;
        }

        return true;
    }

    doesStateFulfillGoal(desiredState, worldVal) {
        if (!('key' in desiredState) || !('val' in desiredState) || !('op' in desiredState))
            return false;

        switch (desiredState['op']) {
            case '=':
            case '==':
            case '===':
                if (worldVal === desiredState['val']) return true;
                break;
            case '!=':
            case '!==':
                if (worldVal !== desiredState['val']) return true;
                break;
            case '>':
                if (worldVal > desiredState['val']) return true;
                break;
            case '>=':
                if (worldVal >= desiredState['val']) return true;
                break;
            case '<':
                if (worldVal < desiredState['val']) return true;
                break;
            case '<=':
                if (worldVal <= desiredState['val']) return true;
                break;
            default:
                return false;
        }
    }
}