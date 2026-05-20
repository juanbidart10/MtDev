import { PersonajeDataModel } from "../models/personaje-model.js";
import { CompetenciaDataModel } from "../models/competencia-model.js";
import { ObjetoDataModel } from "../models/objeto-model.js";

import { PersonajeSheet } from "./actors/personaje-sheet.js";
import { ObjetoSheet } from "./items/objeto-sheet.js";
import { CompetenciaSheet } from "./items/competencia-sheet.js";

import { aplicarDanioLocalizado } from "./utils/combat.js";
import { mtrolRoll } from "./core/mtrol-rolls.js";
import "./core/mtrol-skills.js";

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

  foundry.documents.collections.Items.registerSheet(
    "mtrol",
    CompetenciaSheet,
    {
      types: ["competencia"],
      makeDefault: true
    }
  );
});

// =====================================================
// MTROL - APLICAR DAÑO AUTORIZADO
// Ejecuta el GM, pero la acción puede venir del jugador.
// Solo modifica HP, defensa y rotura de equipo.
// =====================================================

async function aplicarDanioAutorizado({
  attackerActor,
  targetActor,
  targetTokenDocument,
  payload
}) {

  if (!game.user.isGM) return;

  const danio =
    Number(payload?.danio ?? 0);

  const slot =
    payload?.slot ?? null;

  if (
    !targetActor ||
    !Number.isFinite(danio) ||
    danio <= 0
  ) {

    console.warn(
      "MTROL | Daño autorizado inválido:",
      payload
    );

    return;
  }

  const hpActual =
    Number(
      targetActor.system?.hp?.value ?? 0
    );

  let danioRestante =
    danio;

  let itemDefensivo =
    null;

  let defensaActual =
    0;

  let defensaNueva =
    0;

  let itemDestruido =
    false;

  // =========================================
  // BUSCAR EQUIPO DEFENSIVO
  // =========================================

  if (slot) {

    itemDefensivo =
      targetActor.items.find(i =>

        i.type === "objeto" &&
        i.system?.equipado === true &&
        i.system?.slot === slot &&
        Number(i.system?.defensa ?? 0) > 0

      );

    // =====================================
    // ARMADURA ENCONTRADA
    // =====================================

    if (itemDefensivo) {

      defensaActual =
        Number(
          itemDefensivo.system.defensa ?? 0
        );

      // =================================
      // ARMADURA SE ROMPE
      // =================================

      if (danio >= defensaActual) {

        danioRestante =
          danio - defensaActual;

        defensaNueva =
          0;

        itemDestruido =
          true;

        await targetActor.deleteEmbeddedDocuments(
          "Item",
          [itemDefensivo.id]
        );

      }

      // =================================
      // ARMADURA ABSORBE
      // =================================

      else {

        defensaNueva =
          defensaActual - danio;

        danioRestante =
          0;

        await itemDefensivo.update({

          "system.defensa":
            defensaNueva

        });

      }

    }

  }

  // =========================================
  // APLICAR HP
  // =========================================

  const hpNuevo =
    Math.max(
      0,
      hpActual - danioRestante
    );

  await targetActor.update({

    "system.hp.value":
      hpNuevo

  });

  // =========================================
  // MUERTE
  // =========================================

  if (
    hpNuevo <= 0 &&
    targetTokenDocument
  ) {

    await targetTokenDocument.update({

      overlayEffect:
        "icons/svg/skull.svg"

    });

  }

  // =========================================
  // CHAT CARD
  // =========================================

  await ChatMessage.create({

    speaker:
      ChatMessage.getSpeaker({
        actor: attackerActor
      }),

    content: `

      <div class="mtrol-chat-card">

        <h2>Daño aplicado</h2>

        <p>
          <b>Atacante:</b>
          ${attackerActor.name}
        </p>

        <p>
          <b>Objetivo:</b>
          ${targetActor.name}
        </p>

        <p>
          <b>Daño total:</b>
          ${danio}
        </p>

        ${slot
          ? `<p><b>Zona:</b> ${slot}</p>`
          : ""
        }

        ${itemDefensivo
          ? `<p><b>Armadura:</b> ${itemDefensivo.name}</p>`
          : ""
        }

        ${itemDefensivo
          ? `<p><b>Defensa:</b> ${defensaActual} → ${defensaNueva}</p>`
          : ""
        }

        ${itemDestruido
          ? `<p><b>Resultado:</b> Armadura destruida</p>`
          : ""
        }

        <p>
          <b>Daño a HP:</b>
          ${danioRestante}
        </p>

        <p>
          <b>HP:</b>
          ${hpActual} → ${hpNuevo}
        </p>

      </div>

    `
  });

}

Hooks.once("ready", function () {

  console.log(
    "MtRol | READY - Sistema completamente cargado"
  );

  // =========================
  // API GLOBAL MTROL
  // =========================

  game.mtrol = game.mtrol || {};

  game.mtrol.aplicarDanioLocalizado =
    aplicarDanioLocalizado;

  game.mtrol.aplicarDanioAutorizado =
    aplicarDanioAutorizado;

  // MOTOR CENTRAL DE TIRADAS
  game.mtrol.roll = mtrolRoll;

  console.log(
    "MtRol | API de combate registrada."
  );

  // =====================================================
  // MTROL SOCKET - ACCIONES AUTORIZADAS
  // =====================================================

  game.socket.on("system.mtrol", async (data) => {

    // Solo GM ejecuta modificaciones reales
    if (!game.user.isGM) return;

    if (!data) return;

    if (data.action !== "mtrolAplicarDanio")
      return;

    try {

      const attackerActor =
        await fromUuid(data.attackerUuid);

      const targetTokenDocument =
        await fromUuid(data.targetTokenUuid);

      if (
        !attackerActor ||
        !targetTokenDocument ||
        !targetTokenDocument.actor
      ) {

        console.warn(
          "MTROL | Datos inválidos socket daño",
          data
        );

        return;
      }

      const targetActor =
        targetTokenDocument.actor;

      const payload =
        data.payload ?? {};

      await game.mtrol.aplicarDanioAutorizado({

        attackerActor,
        targetActor,
        targetTokenDocument,
        payload

      });

    } catch (err) {

      console.error(
        "MTROL | Error socket daño:",
        err
      );

    }

  });

});

// =========================
// ITEM PILES - LIMPIAR COMPETENCIAS SOLO AL CONVERTIR EN BOTÍN
// =========================

Hooks.on("updateActor", async (actor, changes) => {
  if (!game.user.isGM) return;

  const cambioItemPiles =
    changes?.flags?.["item-piles"] ||
    changes?.flags?.itempiles;

  if (!cambioItemPiles) return;

  const actorEsBotin =
    actor.flags?.["item-piles"] ||
    actor.flags?.itempiles;

  if (!actorEsBotin) return;

  const competencias = actor.items.filter(i =>
    i.type === "competencia"
  );

  if (!competencias.length) return;

  await actor.deleteEmbeddedDocuments(
    "Item",
    competencias.map(i => i.id)
  );

  console.log(
    `MtRol | ${competencias.length} competencias eliminadas del botín ${actor.name}.`
  );
});

// =========================
// DHARMA / KARMA AUTOMÁTICO
// =========================

Hooks.on("createChatMessage", async (message) => {
  try {
    const rolls = message.rolls ?? [];
    if (!rolls.length) return;

    if (!game.user.isGM) return;

    const actor = _mtrolObtenerActorDesdeMensaje(message);

    if (!actor) {
      console.warn("MtRol | No se pudo detectar actor para Dharma/Karma:", message);
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

  const userId = message.user?.id ?? message.user;
  const user = game.users.get(userId);

  if (user?.character) {
    return user.character;
  }

  return null;
}

