import { WeaponDamage } from "@item/weapon/data";

export interface StateCheck {
    key: string;
    val: number | string | boolean;
    op: string;
    penalty?: number;
}

export interface Effect {
    key: string;
    val: number | string | boolean | WeaponDamage;
    op: string;
}

export type WorldState = Record<string, number | string | boolean>;