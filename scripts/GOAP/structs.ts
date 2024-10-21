import { WeaponDamage } from "@item/weapon/data";

type AdjacentToPattern = `adjacent_to_${string}`;
type AcPattern = `${string}.ac`;
type FortPattern = `${string}.fort`;
type WillPattern = `${string}.will`;
type RefPattern = `${string}.ref`;
type HpPattern = `${string}.hp`;

type Condition = "blinded" | "clumsy" | "concealed" | "confused" | "controlled" 
    | "dazzled" | "deafened" | "drained" | "enfeebled" | "fascinated" | "fatigued" 
    | "fleeing" | "frightened" | "grabbed" | "hidden" | "immobilized" | "invisible" 
    | "observed" | "off-guard" | "paralyzed" | "petrified" | "prone" | "quickened" 
    | "restrained" | "sickened" | "slowed" | "stunned" | "stupefied" | "unconscious" 
    | "undetected";
type Penalties = "status_penalty_to_attack" | "circumstance_penalty_to_attack" | "item_penalty_to_attack" | "multiple_attack_penalty";
type Bonuses = "status_bonus_to_attack" | "circumstance_bonus_to_attack" | "item_bonus_to_attack";
type DefensePattern = AcPattern | FortPattern | WillPattern | RefPattern;

type WorldStateKey = AdjacentToPattern | HpPattern | DefensePattern | Condition | Penalties | Bonuses;

export interface StateCheck {
    key: WorldStateKey;
    val: number | string | boolean;
    op: string;
    penalty?: number;
}

export interface Effect {
    key: WorldStateKey;
    val: number | string | boolean | WeaponDamage;
    op: string;
}

export type WorldState = Record<WorldStateKey, number | string | boolean>;