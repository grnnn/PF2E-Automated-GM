import { Agent } from './Agent.js';

Hooks.on("init", () => {
  console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
  //CONFIG.debug.hooks = true;
});

let agents = [];

Hooks.on("combatStart", (encounterPf2e) => {
  console.log("encounter start!");
  let npcActors = [];
  let pcActors = [];
  for (let combatant of encounterPf2e.turns) {
    let actor = game.scenes.active.tokens.find(token => token.actor.id === combatant.actorId).actor;
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

Hooks.on("deleteCombat", (encounterPf2e) => {
  console.log("encounter end!");
  for (let agent of agents) agent.cleanUp();
  agents = [];
});
