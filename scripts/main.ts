import { TokenPF2e } from '@module/canvas/index.js';
import { CombatantPF2e, EncounterPF2e } from "@module/encounter/index.ts"
import { Agent } from './Agent.js';


Hooks.on("init", () => {
  console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
  //CONFIG.debug.hooks = true;
});

let agents = [];

Hooks.on("combatStart", (encounterPf2e: EncounterPF2e) => {
  console.log("encounter start!");
  let npcActors = [];
  let pcActors = [];
  for (let combatant of encounterPf2e.combatants) {
    let actor = game.scenes.active.tokens.find((token : TokenPF2e) => token.actor.id === combatant.actorId).actor;
    if (actor?.type === "npc") {
      npcActors.push([actor, combatant.tokenId]);
    }
    if (actor?.type === "character") {
      pcActors.push(actor);
    }
  }

  for (const [npcActor, tokenId] of npcActors) {
    agents.push(new Agent(npcActor, tokenId, pcActors));
  }
});

Hooks.on("deleteCombat", () => {
  console.log("encounter end!");
  for (let agent of agents) agent.cleanUp();
  agents = [];
});
