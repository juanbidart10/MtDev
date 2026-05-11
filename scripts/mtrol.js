import { PersonajeDataModel } from "../models/personaje-model.js";
import { CompetenciaDataModel } from "../models/competencia-model.js";
import { ObjetoDataModel } from "../models/objeto-model.js";
import { PersonajeSheet } from "./actors/personaje-sheet.js";
import { ObjetoSheet } from "./items/objeto-sheet.js";
import { aplicarDanioLocalizado } from "./utils/combat.js";

Hooks.once("init", function () {
  console.log("MtRol | INIT");

  CONFIG.Actor.dataModels = {
    personaje: PersonajeDataModel
  };

  CONFIG.Item.dataModels = {
    competencia: CompetenciaDataModel,
    objeto: ObjetoDataModel
  };

  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.appv1.sheets.ActorSheet
  );

  foundry.documents.collections.Actors.registerSheet(
    "mtrol",
    PersonajeSheet,
    {
      types: ["personaje"],
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
      types: ["objeto"],
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