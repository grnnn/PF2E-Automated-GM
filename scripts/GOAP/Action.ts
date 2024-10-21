import { TraitViewData } from "@actor/data/base.js";
import { StateCheck, Effect, WorldState } from "./structs.ts";
import { WeaponDamage } from "@item/weapon/data.js";
import { WeaponPF2e } from "@item";

// Define the string literal type
export type DefenseType = "ac" | "fort" | "will" | "ref";

export class Action {
    public name: string;                    // name of the action (eg "Strike", "Stride")
    public numberOfActions: number;         // number of actions to execute
    private preconditions: StateCheck[];    // what must be true of the actor's world state before acting
    private effects: Effect[];              // what is projected to be true of the actor's world state after acting
    private weaponData: WeaponPF2e | null;  // weapon data for calculating damage
    private defenseType: DefenseType;       // defense type for calculating damage

    constructor(name : string, numberOfActions : number, preconditions : StateCheck[], effects : Effect[], weaponData: WeaponPF2e | null = null, defenseType: DefenseType = "ac") {
        this.name = name;
        this.numberOfActions = numberOfActions;
        this.preconditions = preconditions;
        this.effects = effects;
        this.weaponData = weaponData;
        this.defenseType = defenseType; 
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
            let value : string | number | boolean | WeaponDamage = effect.val;

            if (this.isWeaponDamage(value)) {
                // key format for players: player1.ac, player1.hp, player1.fortSave, etc etc
                let playerName = effect.key.split('.')[0];
                value = this.calculateMedianDamage(playerName, value as WeaponDamage, worldState);
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

    // Type guard function to check if a value is of type WeaponDamage
    isWeaponDamage(value: any): value is WeaponDamage {
        return value && typeof value === 'object' && 'dice' in value && 'die' in value && 'modifier' in value;
    }   

    calculateMedianDamage(playerName : string, damageValue : WeaponDamage, worldState : WorldState) : number{
        if (playerName === '') {
            return Math.max(Math.round(this.getMedianDiceDamage(damageValue)), 1);
        }

        let medDamageOnHit = this.getMedianDiceDamage(damageValue);
        let hitChances = this.calculateChanceToHitAndCrit(playerName, worldState);
        if (hitChances[1] > 0) {
            let medDamageOnCrit = (medDamageOnHit * 2); // todo deadly dice
            return Math.max(Math.round((medDamageOnHit * hitChances[0]) + (medDamageOnCrit * hitChances[1])), 1);
        }
        
        return Math.max(Math.round(medDamageOnHit * hitChances[0]), 1);
    }

    getMedianDiceDamage(damageValue : WeaponDamage) : number{
        let result = 0;

        const dicePattern = /d(\d+)/g;
        let diceMatch;
        while((diceMatch = dicePattern.exec(damageValue.die!)) !== null) {
            let numSides = parseInt(diceMatch[1]);
            let singleDiceVal = (numSides % 2 === 0) ? (numSides / 2 + 0.5) : ((numSides + 1)/2);

            result += damageValue.dice * singleDiceVal;
        }

        result += damageValue.modifier;

        return result;
    }

    calculateChanceToHitAndCrit(playerName : string, worldState : WorldState) : [number, number] {
        let map = worldState["multiple_attack_penalty"] as number;
        if (this.weaponData === null) {
            return [0.6 - (map * 0.25), 0.05];
        }

        let modifier = 0;
        // multiple attack penalty
        let mapPen = this.weaponData.traits.has("agile") ? 4 : 5;
        modifier -= (map * mapPen);
        // status penalties
        let clumsy = (this.weaponData.traits.has("finesse") || this.weaponData.isRanged) ? worldState["clumsy"] as number || 0 : 0;
        let enfeebled = (!this.weaponData.traits.has("finesse") && this.weaponData.isMelee) ? worldState["enfeebled"] as number || 0 : 0;
        let frightened = worldState["frightened"] as number || 0;
        let sickened = worldState["sickened"] as number || 0;
        let miscPenalty = worldState["status_penalty_to_attack"] as number || 0;
        modifier -= Math.max(clumsy, enfeebled, frightened, sickened, miscPenalty);
        // circumstance penalties
        let pronePenalty = worldState["prone"] === true ? 2 : 0;
        miscPenalty = worldState["circumstance_penalty_to_attack"] as number || 0;
        modifier -= Math.max(pronePenalty, miscPenalty);
        // item penalties
        miscPenalty = worldState["item_penalty_to_attack"] as number || 0;
        modifier -= miscPenalty;
        // bonuses
        let statusBonus = worldState["status_bonus_to_attack"] as number || 0;
        let circumstanceBonus = worldState["circumstance_bonus_to_attack"] as number || 0;
        let itemBonus = worldState["item_bonus_to_attack"] as number || 0;
        modifier += statusBonus + circumstanceBonus + itemBonus;
        
        let defVal = worldState[`${playerName}.${this.defenseType}`] as number;
        let attackVal = this.weaponData.flags.pf2e.fixedAttack as number;

        // 10 is the maximium number of rolls that can hit, because 10 above an DC is a crit
        let rollsThatHit = this.clamp(20 - (defVal - (attackVal + modifier)), 0, 10); 
        // 20 is the maximum number of rolls that can crit, 
        let rollsThatCrit = this.clamp(20 - ((defVal + 10) - (attackVal + modifier)), 0, 20);

        // check nat 1
        if (1 + attackVal + modifier >= defVal + 10) {
            rollsThatCrit--;
            rollsThatHit++;
        }
        else if (1 + attackVal + modifier >= defVal) {
            rollsThatHit--;
        }

        // check nat 20
        if (20 + attackVal + modifier >= defVal && 20 + attackVal + modifier < defVal + 10) {
            rollsThatCrit++;
            rollsThatHit--;
        }
        else if (20 + attackVal + modifier >= defVal - 10 && 20 + attackVal + modifier < defVal) {
            rollsThatHit++;
        }
        
        return [rollsThatHit / 20, rollsThatCrit / 20];
    }

    clamp(val : number, min : number, max : number) : number {
        return Math.min(Math.max(val, min), max);
    }
}