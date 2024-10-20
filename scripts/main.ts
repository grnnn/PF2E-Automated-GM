import '../types/types/foundry/index.d.ts'
import '../types/src/global.d.ts'

import type { TokenDocumentPF2e } from '@module/scene/token-document/document.d.ts';
import { EncounterPF2e } from "@module/encounter/index.ts"
import { ScenePF2e } from '@module/scene/document.js';
import { ActorPF2e } from '@actor';

import { Agent } from './agent.ts';


Hooks.on("init", () => {
  console.log("This code runs once the Foundry VTT software begins its initialization workflow.");
  //CONFIG.debug.hooks = true;
});

let agents : Agent[] = [];

Hooks.on("combatStart", (encounterPf2e: EncounterPF2e) => {
  console.log("encounter start!");
  let npcActors : [ActorPF2e, string][] = [];
  let pcActors = [];
  for (let combatant of encounterPf2e.combatants) {
    let actor : ActorPF2e = game?.scenes.active?.tokens.find((token : TokenDocumentPF2e<ScenePF2e>) => token.actor?.id === combatant.actorId)?.actor!;
    
    if (actor.type === "npc") {
      npcActors.push([actor, combatant.tokenId!]);
    }
    if (actor.type === "character") {
      pcActors.push(actor);
    }
  }

  for (const [npcActor, tokenId] of npcActors) {
    let actor = npcActor as ActorPF2e;
    agents.push(new Agent(actor, tokenId, pcActors));
  }
});

Hooks.on("deleteCombat", () => {
  console.log("encounter end!");
  for (let agent of agents) agent.cleanUp();
  agents = [];
});
