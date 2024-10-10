import { Action } from './GOAP/Action.js';
import { Goal } from './GOAP/Goal.js';
import { Planner } from './GOAP/Planner.js';

export class Agent {
    constructor(actor, tokenId, players) {
        this.actor = actor;
        this.players = players;

        this.actions = {};
        this.generateActions();

        this.planner = new Planner(this.actions);

        this.hookId = Hooks.on("pf2e.startTurn", (combatant) => {
            if (combatant.tokenId !== tokenId)
                return;

            this.createPlan();
        });
    }

    cleanUp() {
        Hooks.off("pf2e.startTurn", this.hookId);
    }

    createPlan() {
        this.planner.setGoal(this.generateGoal());
        let plan = this.planner.generatePlan(this.generateWorldState());
        console.log(plan);
    }

    generateActions() {
        // iterate through all provided actions
        let actions = this.actor.system.actions;
        for (const sm of actions) {
            // strikes
            if (sm.type === "strike") {
                let weapon = sm.weapon;
                for (const player of this.players) {
                    this.addAction(new Action(weapon.name + " on " + player.name, 1, weapon.system.traits.value,
                        [{"key": "adjacent_to_" + player.name, "val": true, "op": "==="}, {"key": player.name + ".hp", "val": 0, "op": ">"}],
                        [{"key": player.name + ".hp", "val": sm.weapon?.damage, "op": "-", "tag": "damage"}, {'key': "multiple_attack_penalty", 'val': 1, 'op': "+"}]
                    ));
                }
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

    addAction(action) {
        this.actions[action.name] = action;
    }

    generateWorldState() {
        let worldState = {};
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