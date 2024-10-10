export class Action {
    constructor(name, numberOfActions, traits, preconditions, effects, criticalEffects = []) {
        this.name = name;                       // name of the action (eg "Strike", "Stride")
        this.numberOfActions = numberOfActions; // number of actions to execute
        this.traits = traits;                   // pf2e-specific traits, used for damage calculations on attacks
        this.preconditions = preconditions;     // what must be true of the actor's world state before acting
        this.effects = effects;                 // what is projected to be true of the actor's world state after acting
        this.criticalEffects = criticalEffects; // what is projected to be true of the actor's world state after acting
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
                    break;
                case '!=':
                case '!==':
                    if (worldVal === precondition['val']) return false;
                    break;
                case '>':
                    if (worldVal <= precondition['val']) return false;
                    break;
                case '>=':
                    if (worldVal < precondition['val']) return false;
                    break;
                case '<':
                    if (worldVal >= precondition['val']) return false;
                    break;
                case '<=':
                    if (worldVal > precondition['val']) return false;
                    break;
                default:
                    return false;
            }
        }

        return true;
    }

    applyEffects(worldState, prevActionCost) {
        // effects formatted like:
        //  { "key": "name", "val": 1, "op": "+"}
        let result = { ...worldState };
        for (const effect of this.effects) {
            if (!('key' in effect) || !('val' in effect) || !('op' in effect))
                continue;

            let value = effect['val'];
            if (effect['tag'] === 'damage') {
                // key format for players: player1.ac, player1.hp, player1.fortSave, etc etc
                let playerName = effect['key'].split('.')[0];
                let defType = 'ac'; // todo figure out how to extract different defenses
                value = this.calculateMedianDamage(playerName, value, defType, worldState);
            }
            
            // console.log("current state:");
            // console.log(result);
            // let effectKey = effect['key'];
            // console.log(effectKey)
            let worldVal = result[effect['key']];
            console.log("world val: " + worldVal);
            switch (effect['op']) {
                case '=':
                    worldVal = value;
                    break;
                case '+':
                    worldVal += value;
                    break;
                case '-':
                    worldVal -= value;
                    break;
                case '*':
                case 'x':
                    worldVal *= value;
                    break;
                case '/':
                    worldVal /= value;
                    break;
                case '%':
                    worldVal %= value;
                    break;
            }
            result[effect['key']] = worldVal;
        }

        if ((prevActionCost + this.numberOfActions) % 3 === 0 && prevActionCost % 3 !== 0) {
            result['multiple_attack_penalty'] = 0;
        }

        return result;
    }

    calculateMedianDamage(playerName, damageValue, defType, worldState) {
        if (playerName === null || playerName === '') {
            return this.getMedianDiceDamage(damageValue) * 0.5;
        }

        let medDamageOnHit = this.getMedianDiceDamage(damageValue);
        let chanceToHit = this.calculateChanceToHit(playerName, defType, worldState);
        if (chanceToHit - 0.5 > 0) { // checking if we can crit, todo account for nat 1, nat 20
            let deadlyDice = '';
            let deadlyDiceTrait = this.traits.find(trait => trait.startsWith("deadly "));
            if (deadlyDiceTrait !== undefined)
                deadlyDice = deadlyDiceTrait.substring(7);
            let medDamageOnCrit = (medDamageOnHit * 2) + this.getMedianDiceDamage(deadlyDice);

            return Math.max(Math.round((medDamageOnHit * chanceToHit) + (medDamageOnCrit * (chanceToHit - 0.5))), 1);
        } else {
            return Math.max(Math.round(medDamageOnHit * chanceToHit), 1);
        }
    }

    getMedianDiceDamage(roll) {
        if (roll === null || roll === '') {
            return 0;
        }

        const dicePattern = /(\d*)d(\d+)/g;
        const modifierPattern = /([+-]\s*\d+)/g;

        let result = 0;
        // match dice
        let diceMatch;
        while((diceMatch = dicePattern.exec(roll)) !== null) {
            let numDice = parseInt(diceMatch[1] || "1");
            let numSides = parseInt(diceMatch[2]);
            let singleDiceVal = (numSides % 2 === 0) ? (numSides / 2 + 0.5) : ((sides + 1)/2);

            result += numDice * singleDiceVal;
        }

        // match modifiers
        let modMatch;
        while((modMatch = modifierPattern.exec(roll)) !== null) {
            let mod = parseInt(modMatch[0].replace(/\s+/g, ""));
            result += mod;
        }

        return result;
    }

    calculateChanceToHit(playerName, defType, worldState) {
        let map = worldState["multiple_attack_penalty"];
        return 0.6 - (map * 0.25); // todo
    }
}