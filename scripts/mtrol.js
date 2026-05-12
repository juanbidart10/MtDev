import { PersonajeDataModel } from "../models/personaje-model.js";
import { CompetenciaDataModel } from "../models/competencia-model.js";
import { ObjetoDataModel } from "../models/objeto-model.js";

import { PersonajeSheet } from "./actors/personaje-sheet.js";
import { ObjetoSheet } from "./items/objeto-sheet.js";

import { aplicarDanioLocalizado } from "./utils/combat.js";

Hooks.once("init", function () {
  console.log("MtRol | INIT");

  // =========================
  // DATA MODELS
  // =========================

  CONFIG.Actor.dataModels = {
    personaje: PersonajeDataModel,
    character: PersonajeDataModel // Legacy Simple Worldbuilding
  };

  CONFIG.Item.dataModels = {
    objeto: ObjetoDataModel,
    competencia: CompetenciaDataModel,
    item: ObjetoDataModel // Legacy Simple Worldbuilding
  };

  // =========================
  // ACTOR SHEETS
  // =========================

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

  // =========================
  // ITEM SHEETS
  // =========================

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

  // =========================
  // API GLOBAL MTROL
  // =========================

  game.mtrol = game.mtrol || {};
  game.mtrol.aplicarDanioLocalizado = aplicarDanioLocalizado;

  console.log("MtRol | API de combate registrada.");
});

// =========================
// ITEM PILES - LIMPIAR COMPETENCIAS
// =========================

Hooks.on("updateActor", async (actor, changes, options, userId) => {
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

Hooks.on("renderItemPileInventoryApp", async (app, html, data) => {
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

Hooks.on("createChatMessage", async (message) => {
  if (!game.user.isGM) return;

  const rolls = message.rolls ?? [];
  if (!rolls.length) return;

  const speaker = message.speaker;
  if (!speaker?.actor) return;

  const actor = game.actors.get(speaker.actor);
  if (!actor) return;

  let resultadoEncontrado = null;

  for (const roll of rolls) {
    for (const term of roll.terms) {
      if (!term.results) continue;

      for (const result of term.results) {
        const valor = result.result;

        if (valor === 1) {
          resultadoEncontrado = "dharma";
          break;
        }

        if (valor === 2) {
          resultadoEncontrado = "karma";
          break;
        }
      }

      if (resultadoEncontrado) break;
    }

    if (resultadoEncontrado) break;
  }

  if (!resultadoEncontrado) return;

  const path = `system.recursos.${resultadoEncontrado}`;
  const actual = Number(foundry.utils.getProperty(actor, path) ?? 0);
  const nuevoValor = actual + 1;

  await actor.update({
    [path]: nuevoValor
  });

  if (resultadoEncontrado === "dharma") {
    console.log(`🏆 Carta de Dharma | ${actor.name}`);

    if (nuevoValor >= 5) {
      console.log(`🏆 Carta de Dharma | ${actor.name} llegó a 5 puntos de Dharma.`);
    }
  }

  if (resultadoEncontrado === "karma") {
    console.log(`💀 Carta de Karma | ${actor.name}`);

    if (nuevoValor >= 5) {
      console.log(`💀 Carta de Karma | ${actor.name} llegó a 5 puntos de Karma.`);
    }
  }
});