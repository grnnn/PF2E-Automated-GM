// import { Goal } from './GOAP/Goal.js';
// import { Planner } from './GOAP/Planner.js';

import { ActorPF2e } from "@actor";
import { StrikeData } from "@actor/data/base.js";
import { CombatantPF2e } from "@module/encounter/combatant.js";

import { Action } from "./GOAP/action.ts";
import { Goal } from "./GOAP/goal.ts";
import { Planner } from "./GOAP/planner.ts";
import { StateCheck, WorldState } from "./GOAP/structs.ts";
import { WeaponPF2e } from "@item";

export class Agent {
    private actor : ActorPF2e;
    private players : ActorPF2e[];
    private actions : Record<string, Action>;
    private planner : Planner;
    private hookId : number

    constructor(actor : ActorPF2e, tokenId : string, players : ActorPF2e[]) {
        this.actor = actor;
        this.players = players;

        this.actions = {};
        this.generateActions();

        this.planner = new Planner(Object.values(this.actions));

        this.hookId = Hooks.on("pf2e.startTurn", (combatant : CombatantPF2e) => {
            if (combatant.tokenId !== tokenId)
                return;

            this.createPlan();
        });
    }

    cleanUp() : void {
        Hooks.off("pf2e.startTurn", this.hookId);
    }

    createPlan() : void {
        let goal = this.generateGoal();
        let plan = this.planner.generatePlan(this.generateWorldState(), goal);
        console.log(plan);
    }

    generateActions() : void {
        // iterate through all provided actions
        let strikes : StrikeData[] = this.actor.system.actions!;
        for (const strike of strikes) {
            for (const player of this.players) {
                // strikes
                if (strike.type === "strike") {
                    this.addAction(new Action(`${strike.label} on ${player.name}`, 1,
                        [{ key: `adjacent_to_${player.name}`, val: true, op: "===" }, { key: `${player.name}.hp`, val: 0, op: ">" }],
                        [{ key: `${player.name}.hp`, val: strike.item.baseDamage, op: "-"}, { key: "multiple_attack_penalty", val: 1, op: "+" }],
                        strike.item as WeaponPF2e
                    ));
                }
            }
        }

        // move
        for (const player of this.players) {
            this.addAction(new Action("Move to " + player.name, 1,
                [{key: `adjacent_to_${player.name}`, val: false, op: "==="}],
                [{key: `adjacent_to_${player.name}`, val: true, op: "="}]
            ))
        }
    } 

    addAction(action : Action) : void {
        this.actions[action.name] = action;
    }

    generateWorldState() : WorldState {
        let worldState : WorldState = {
            hidden: false,
            blinded: false,
            clumsy: 0,
            confused: false,
            controlled: false,
            dazzled: false,
            deafened: false,
            drained: 0,
            enfeebled: 0,
            fascinated: false,
            fatigued: false,
            fleeing: false,
            frightened: 0,
            grabbed: false,
            immobilized: false,
            "off-guard": false,
            paralyzed: false,
            petrified: false,
            prone: false,
            restrained: false,
            sickened: 0,
            slowed: 0,
            stunned: 0,
            stupefied: 0,
            unconscious: false,
            concealed: false,
            invisible: false,
            observed: false,
            quickened: false,
            undetected: false,
            status_penalty_to_attack: 0,
            circumstance_penalty_to_attack: 0,
            item_penalty_to_attack: 0,
            multiple_attack_penalty: 0,
            status_bonus_to_attack: 0,
            circumstance_bonus_to_attack: 0,
            item_bonus_to_attack: 0
        };
        for (const player of this.players) {
            worldState[`adjacent_to_${player.name}`] = false;
            worldState[`${player.name}.hp`] = 20;
        }

        return worldState;
    }

    generateGoal() : Goal {
        let goalStates : StateCheck[] = [];
        for (const player of this.players) {
            goalStates.push({key: `${player.name}.hp`, val: 0, op: "<="});
        }

        return new Goal("kill em all", goalStates);
    }
}