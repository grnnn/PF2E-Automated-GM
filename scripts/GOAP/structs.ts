export interface StateCheck {
    key: string;
    val: number | string | boolean;
    op: string;
    penalty?: number;
}

export interface Effect {
    key: string;
    val: number | string | boolean;
    op: string;
    tag?: string;
}

export type WorldState = Record<string, number | string | boolean>;