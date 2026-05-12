import { PersonajeDataModel } from "../models/personaje-model.js";
import { CompetenciaDataModel } from "../models/competencia-model.js";
import { ObjetoDataModel } from "../models/objeto-model.js";

import { PersonajeSheet } from "./actors/personaje-sheet.js";
import { ObjetoSheet } from "./items/objeto-sheet.js";

import { aplicarDanioLocalizado } from "./utils/combat.js";

Hooks.once("init", function () {
  console.log("MtRol | INIT");

  CONFIG.Actor.dataModels = {
    personaje: PersonajeDataModel,
    character: PersonajeDataModel
  };

  CONFIG.Item.dataModels = {
    objeto: ObjetoDataModel,
    competencia: CompetenciaDataModel,
    item: ObjetoDataModel
  };

  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.appv1.sheets.ActorSheet
  );

  foundry.documents.collections.Actors.registerSheet(
    "mtrol",
    PersonajeSheet,
    {
      types: ["personaje", "character"],
      makeDefault: true
    }
  );

  foundry.documents.collections.Items.unregisterSheet(
    "core",
    foundry.appv1.sheets.ItemSheet
  );

  foundry.documents.collections.Items.registerSheet(
    "mtrol",
    ObjetoSheet,
    {
      types: ["objeto", "item"],
      makeDefault: true
    }
  );
});

Hooks.once("ready", function () {
  console.log("MtRol | READY - Sistema completamente cargado");

  game.mtrol = game.mtrol || {};
  game.mtrol.aplicarDanioLocalizado = aplicarDanioLocalizado;

  console.log("MtRol | API de combate registrada.");
});

// =========================
// ITEM PILES - LIMPIAR COMPETENCIAS
// =========================

Hooks.on("updateActor", async (actor) => {
  if (!game.user.isGM) return;

  const tieneFlagItemPiles =
    actor.getFlag("item-piles", "data") ||
    actor.flags?.["item-piles"];

  if (!tieneFlagItemPiles) return;

  setTimeout(async () => {
    const competencias = actor.items.filter(i => i.type === "competencia");
    if (!competencias.length) return;

    await actor.deleteEmbeddedDocuments(
      "Item",
      competencias.map(i => i.id)
    );

    console.log(`MtRol | Competencias removidas del botín: ${actor.name}`);
  }, 500);
});

Hooks.on("renderItemPileInventoryApp", async (app) => {
  if (!game.user.isGM) return;

  const actor = app.actor;
  if (!actor) return;

  const competencias = actor.items.filter(i => i.type === "competencia");
  if (!competencias.length) return;

  await actor.deleteEmbeddedDocuments(
    "Item",
    competencias.map(i => i.id)
  );

  app.render(true);
});

// =========================
// DHARMA / KARMA AUTOMÁTICO
// =========================

Hooks.on("createChatMessage", async (message) => {
  try {
    const rolls = message.rolls ?? [];
    if (!rolls.length) return;

    if (message.user?.id !== game.user.id) return;

    const actor = _mtrolObtenerActorDesdeMensaje(message);

    if (!actor) {
      console.warn("MtRol | No se encontró actor para Dharma/Karma.");
      return;
    }

    let sumaDharma = false;
    let sumaKarma = false;

    for (const roll of rolls) {
      for (const die of roll.dice ?? []) {
        for (const result of die.results ?? []) {
          if (result.active === false) continue;

          const valor = Number(result.result);

          if (valor === 1) sumaDharma = true;
          if (valor === 2) sumaKarma = true;
        }
      }
    }

    if (!sumaDharma && !sumaKarma) return;

    const updates = {};

    if (sumaDharma) {
      const actual = Number(actor.system.recursos?.dharma ?? 0);
      const nuevo = Math.min(5, actual + 1);

      updates["system.recursos.dharma"] = nuevo;

      console.log(`🏆 MtRol | ${actor.name} suma +1 Dharma (${actual} → ${nuevo})`);

      if (actual === 4 && nuevo === 5) {
        ui.notifications.info(`🏆 ${actor.name} obtuvo una Carta de Dharma`);

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `
            <div style="text-align:center; font-size:18px; padding:10px;">
              🏆 <strong>Carta de Dharma</strong> 🏆
              <br><br>
              ${actor.name} alcanzó 5 puntos de Dharma.
            </div>
          `
        });

        console.log(`🏆 Carta de Dharma | ${actor.name}`);
      }
    }

    if (sumaKarma) {
      const actual = Number(actor.system.recursos?.karma ?? 0);
      const nuevo = Math.min(5, actual + 1);

      updates["system.recursos.karma"] = nuevo;

      console.log(`💀 MtRol | ${actor.name} suma +1 Karma (${actual} → ${nuevo})`);

      if (actual === 4 && nuevo === 5) {
        ui.notifications.info(`💀 ${actor.name} obtuvo una Carta de Karma`);

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `
            <div style="text-align:center; font-size:18px; padding:10px;">
              💀 <strong>Carta de Karma</strong> 💀
              <br><br>
              ${actor.name} alcanzó 5 puntos de Karma.
            </div>
          `
        });

        console.log(`💀 Carta de Karma | ${actor.name}`);
      }
    }

    if (Object.keys(updates).length) {
      await actor.update(updates);
    }

  } catch (error) {
    console.error("MtRol | Error procesando Dharma/Karma:", error);
  }
});

function _mtrolObtenerActorDesdeMensaje(message) {
  const speaker = message.speaker ?? {};

  if (speaker.actor) {
    const actor = game.actors.get(speaker.actor);
    if (actor) return actor;
  }

  if (speaker.token && canvas?.scene) {
    const tokenDoc = canvas.scene.tokens.get(speaker.token);
    if (tokenDoc?.actor) return tokenDoc.actor;
  }

  if (canvas?.tokens?.controlled?.length) {
    const actor = canvas.tokens.controlled[0]?.actor;
    if (actor) return actor;
  }

  return null;
}