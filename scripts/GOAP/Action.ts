import { TraitViewData } from "@actor/data/base.js";
import { StateCheck, Effect, WorldState } from "./structs.ts";

export class Action {
    public name: string;                    // name of the action (eg "Strike", "Stride")
    public numberOfActions: number;         // number of actions to execute
    public traits: TraitViewData[];         // pf2e-specific traits, used for damage calculations on attacks
    private preconditions: StateCheck[];    // what must be true of the actor's world state before acting
    private effects: Effect[];              // what is projected to be true of the actor's world state after acting
    private criticalEffects: Effect[];      // what is projected to be true of the actor's world state after critting

    constructor(name : string, numberOfActions : number, traits : TraitViewData[], preconditions : StateCheck[], effects : Effect[], criticalEffects : Effect[] = []) {
        this.name = name;                       
        this.numberOfActions = numberOfActions; 
        this.traits = traits;                   
        this.preconditions = preconditions;     
        this.effects = effects;                 
        this.criticalEffects = criticalEffects;
    }

    canExecute(worldState : WorldState) : boolean {
        for (const precondition of this.preconditions) {
            let worldVal = worldState[precondition.key];
            switch (precondition.op) {
                case '=':
                case '==':
                case '===':
                    if (worldVal !== precondition.val) return false;
                    break;
                case '!=':
                case '!==':
                    if (worldVal === precondition.val) return false;
                    break;
                case '>':
                    if (worldVal <= precondition.val) return false;
                    break;
                case '>=':
                    if (worldVal < precondition.val) return false;
                    break;
                case '<':
                    if (worldVal >= precondition.val) return false;
                    break;
                case '<=':
                    if (worldVal > precondition.val) return false;
                    break;
                default:
                    return false;
            }
        }

        return true;
    }

    applyEffects(worldState : WorldState, prevActionCost : number) : WorldState {
        let result = { ...worldState };
        for (const effect of this.effects) {
            let value = effect.val;
            if (effect?.tag === 'damage') {
                // key format for players: player1.ac, player1.hp, player1.fortSave, etc etc
                let playerName = effect.key.split('.')[0];
                let defType = 'ac'; // todo figure out how to extract different defenses
                let diceVal = value as string;
                value = this.calculateMedianDamage(playerName, diceVal, defType, worldState);
            }
            
            let worldVal = result[effect.key];
            switch (effect.op) {
                case '=':
                    worldVal = value;
                    break;
                case '+':
                    if (typeof worldVal === 'number' && typeof value === 'number')
                        worldVal += value;
                    break;
                case '-':
                    if (typeof worldVal === 'number' && typeof value === 'number')
                        worldVal -= value;
                    break;
                case '*':
                case 'x':
                    if (typeof worldVal === 'number' && typeof value === 'number')
                        worldVal *= value;
                    break;
                case '/':
                    if (typeof worldVal === 'number' && typeof value === 'number')
                        worldVal /= value;
                    break;
                case '%':
                    if (typeof worldVal === 'number' && typeof value === 'number')
                        worldVal %= value;
                    break;
            }
            result[effect.key] = worldVal;
        }

        if ((prevActionCost + this.numberOfActions) % 3 === 0 && prevActionCost % 3 !== 0) {
            result['multiple_attack_penalty'] = 0;
        }

        return result;
    }

    calculateMedianDamage(playerName : string, damageValue : string, defType : string, worldState : WorldState) : number{
        if (playerName === null || playerName === '') {
            return this.getMedianDiceDamage(damageValue) * 0.5;
        }

        let medDamageOnHit = this.getMedianDiceDamage(damageValue);
        let chanceToHit = this.calculateChanceToHit(playerName, defType, worldState);
        if (chanceToHit - 0.5 > 0) { // checking if we can crit, todo account for nat 1, nat 20
            let deadlyDice = '';
            let deadlyDiceTrait = this.traits.find(trait => trait.label.startsWith("deadly "));
            if (deadlyDiceTrait !== undefined)
                deadlyDice = deadlyDiceTrait.label.substring(7);
            let medDamageOnCrit = (medDamageOnHit * 2) + this.getMedianDiceDamage(deadlyDice);

            return Math.max(Math.round((medDamageOnHit * chanceToHit) + (medDamageOnCrit * (chanceToHit - 0.5))), 1);
        } else {
            return Math.max(Math.round(medDamageOnHit * chanceToHit), 1);
        }
    }

    getMedianDiceDamage(roll : string) : number{
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
            let singleDiceVal = (numSides % 2 === 0) ? (numSides / 2 + 0.5) : ((numSides + 1)/2);

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

    calculateChanceToHit(playerName : string, defType : string, worldState : WorldState) : number {
        let map = worldState["multiple_attack_penalty"] as number;
        return 0.6 - (map * 0.25); // todo
    }
}