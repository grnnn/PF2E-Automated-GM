export class Action {
    constructor(name, preconditions, effects, numberOfActions) {
        this.name = name;                       // name of the action (eg "Strike", "Stride")
        this.preconditions = preconditions;     // what must be true of the actor's world state before acting
        this.effects = effects;                 // what is projected to be true of the actor's world state after acting
        this.numberOfActions = numberOfActions; // number of actions to execute
    }

    canExecute(worldState) {
        // preconditions formatted like:
        //  { "key": "name", "val": 1, "op": ">"}
        for (const precondition of this.preconditions) {
            if (!('key' in precondition) || !('val' in precondition) || !('op' in precondition))
                continue;
            
            let worldVal = worldState[precondition['key']];
            switch (precondition['op']) {
                case '=':
                case '==':
                case '===':
                    if (worldVal !== precondition['val']) return false;
                case '!=':
                case '!==':
                    if (worldVal === precondition['val']) return false;
                case '>':
                    if (worldVal <= precondition['val']) return false;
                case '>=':
                    if (worldVal < precondition['val']) return false;
                case '<':
                    if (worldVal >= precondition['val']) return false;
                case '<=':
                    if (worldVal > precondition['val']) return false;
                default:
                    return false;
            }
        }

        return true;
    }

    applyEffects(worldState) {
        // effects formatted like:
        //  { "key": "name", "val": 1, "op": "+"}
        for (const effect of this.effects) {
            if (!('key' in effect) || !('val' in effect) || !('op' in effect))
                continue;
            
            let worldVal = worldState[effect['key']];
            switch (effect['op']) {
                case '=':
                    worldVal = effect['val'];
                case '+':
                    worldVal += effect['val'];
                case '-':
                    worldVal -= effect['val'];
                case '*':
                case 'x':
                    worldVal *= effect['val'];
                case '/':
                    worldVal /= effect['val'];
                case '%':
                    worldVal %= effect['val'];
                default:
                    return;
            }
            worldState[effect['key']] = worldVal;
        }
    }
}