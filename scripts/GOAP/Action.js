export class Action {
    constructor(id, name, preconditions, effects, numberOfActions) {
        this.id = id;                           // id of the action (unique per agent)
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
        let result = { ...worldState };
        for (const effect of this.effects) {
            if (!('key' in effect) || !('val' in effect) || !('op' in effect))
                continue;
            
            let worldVal = result[effect['key']];
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
            }
            result[effect['key']] = worldVal;
        }

        return result;
    }
}