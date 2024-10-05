export class Goal {
    constructor(name, desiredStates) {
      this.name = name;                     // Name of the goal (e.g., "kill enemy")
      this.desiredStates = desiredStates;   // The world states that represents achieving this goal
    }
  
    isAchieved(worldState) {
        // states formatted like:
        // { "key": "name", "val": 1, "op": ">"}
        for (const state of this.desiredStates) {
            if (!('key' in state) || !('val' in state) || !('op' in state))
                continue;
            
            let worldVal = worldState[state['key']];
            switch (state['op']) {
                case '=':
                case '==':
                case '===':
                    if (worldVal !== state['val']) return false;
                case '!=':
                case '!==':
                    if (worldVal === state['val']) return false;
                case '>':
                    if (worldVal <= state['val']) return false;
                case '>=':
                    if (worldVal < state['val']) return false;
                case '<':
                    if (worldVal >= state['val']) return false;
                case '<=':
                    if (worldVal > state['val']) return false;
                default:
                    return false;
            }
        }

        return true;
    }
}