// import { Action } from './GOAP/Action.js';
// import { Goal } from './GOAP/Goal.js';
// import { Planner } from './GOAP/Planner.js';

import { ActorPF2e } from "@actor";
import { StrikeData } from "@actor/data/base.js";
import { CombatantPF2e } from "@module/encounter/combatant.js";

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

        this.planner = new Planner(this.actions);

       this.hookId = Hooks.on("pf2e.startTurn", (combatant : CombatantPF2e) => {
            if (combatant.tokenId !== tokenId)
                return;

            this.createPlan();
        });
    }

    cleanUp() : void{
        Hooks.off("pf2e.startTurn", this.hookId);
    }

    createPlan() : void{
        this.planner.setGoal(this.generateGoal());
        let plan = this.planner.generatePlan(this.generateWorldState());
        console.log(plan);
    }

    generateActions() : void {
        // iterate through all provided actions
        let strikes : StrikeData[] = this.actor.system.actions!;
        for (const strike of strikes) {
            // strikes
            if (strike.type === "strike") {
                this.addAction(new Action(strike.label, 1, strike.traits,
                    [{"key": "adjacent_to_" + strike.label, "val": true, "op": "==="}, {"key": strike.label + ".hp", "val": 0, "op": ">"}],
                    [{"key": strike.label + ".hp", "val": strike.success, "op": "-", "tag": "damage"}, {'key': "multiple_attack_penalty", 'val': 1, 'op': "+"}]
                ));
            }
        }

        // move
        for (const player of this.players) {
            this.addAction(new Action("Move to " + player.name, 1, [],
                [{"key": "adjacent_to_" + player.name, "val": false, "op": "==="}],
                [{"key": "adjacent_to_" + player.name, "val": true, "op": "="}]
            ))
        }
    } 

    addAction(action) : void {
        this.actions[action.name] = action;
    }

    generateWorldState() : Record<string, number | string | boolean> {
        let worldState : Record<string, number | string | boolean> = {};
        for (const player of this.players) {
            worldState["adjacent_to_" + player.name] = false;
            worldState[player.name + ".hp"] = 20;
        }
        worldState['multiple_attack_penalty'] = 0;

        return worldState;
    }

    generateGoal() {
        let goalStates = [];
        for (const player of this.players) {
            goalStates.push({'key': player.name + ".hp", "val": 0, 'op': "<="});
        }

        return new Goal("kill em all", goalStates);
    }
}