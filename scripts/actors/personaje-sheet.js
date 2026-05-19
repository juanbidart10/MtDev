import { mtrolRoll } from "../core/mtrol-rolls.js";
import { aplicarDanioLocalizado } from "../utils/combat.js";

const { ActorSheet } = foundry.appv1.sheets;

const FX_ATRIBUTOS = {
  resistencia: {
    label: "Resistencia",
    file: "modules/JB2A_DnD5e/Library/Generic/Conditions/Boon01/ConditionBoon01_010_Green_600x600.webm"
  },

  carisma: {
    label: "Carisma",
    file: "modules/JB2A_DnD5e/Library/Generic/Nature/SwirlingLeavesOutburst_01_01_Regular_Pink_400x400.webm"
  },

  fuerza: {
    label: "Fuerza",
    file: "modules/JB2A_DnD5e/Library/Generic/Conditions/Curse01/ConditionCurse01_004_Red_600x600.webm"
  },

  inteligencia: {
    label: "Inteligencia",
    file: "modules/JB2A_DnD5e/Library/Generic/Template/Circle/WhirlOutro_01_Regular_Blue_600x600.webm"
  },

  voluntad: {
    label: "Voluntad",
    file: "modules/JB2A_DnD5e/Library/1st_Level/Bless/Bless_01_Regular_Yellow_Intro_400x400.webm"
  },

  aura: {
    label: "Aura",
    file: "modules/JB2A_DnD5e/Library/5th_Level/Antilife_Shell/AntilifeShell_01_Blue_Circle_400x400.webm"
  },

  percepcion: {
    label: "Percepción",
    file: "modules/JB2A_DnD5e/Library/TMFX/Runes/Circle/IllusionSimple_01_Circle_Normal_500.webm"
  },

  destreza: {
    label: "Destreza",
    file: "modules/JB2A_DnD5e/Library/Generic/Energy/Teleport/Teleport01_01_Regular_Blue_500x300.webm"
  },

  suerte: {
    label: "Suerte",
    file: "modules/JB2A_DnD5e/Library/Generic/Fireworks/Firework01_01_Regular_OrangeYellow_600x600.webm"
  }
};

export class PersonajeSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mtrol", "sheet", "actor", "personaje-sheet", "mtrol-personaje"],
      template: "systems/mtrol/templates/actors/personaje-sheet.html",
      width: 900,
      height: 700,

      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "personaje"
      }],

      dragDrop: game.user?.isGM ? [
        {
          dragSelector: ".mtrol-draggable-objeto",
          dropSelector: null
        }
      ] : [],

      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  getData(options) {
  const context = super.getData(options);

  context.actor = this.actor;
  context.system = this.actor.system;
  context.esGM = game.user.isGM;

  context.competencias = this.actor.items.filter(
    i => i.type === "competencia"
  );

  const categoriasBarraCombate = [
    "basico",
    "combate",
    "hechizo",
    "contraataque"
  ];

  context.habilidadesCombate = context.competencias.filter(
    i => categoriasBarraCombate.includes(i.system?.categoria)
  );

  context.competenciasGenerales = context.competencias.filter(
    i => !categoriasBarraCombate.includes(i.system?.categoria)
  );

  context.habilidadesEquipadasCombate = context.habilidadesCombate.filter(
    i => i.system?.equipadaCombate === true || i.system?.equipadaCombate === "true"
  );

  const objetos = this.actor.items.filter(
    i => i.type === "objeto" || i.type === "item"
  );

  context.objetosInventario = objetos.filter(
    o => !o.system.equipado
  );

  context.objetosEquipados = objetos.filter(
    o => o.system.equipado
  );

    const slotsBase = [
      "cabeza",
      "cuello",
      "hombros",
      "brazos",
      "pecho",
      "piernas",
      "pies",
      "manoIzq",
      "manoDer",
      "extra"
    ];

    context.slotsEquipamiento = slotsBase.map(slotKey => {
      const itemId = this.actor.system.equipamiento?.[slotKey] ?? "";
      const item = itemId ? this.actor.items.get(itemId) : null;

      return {
        key: slotKey,
        label: this._capitalizarSlot(slotKey),
        ocupado: !!item,
        item,
        defensa: item?.system?.defensa ?? 0,
        danio: item?.system?.danio ?? ""
      };
    });

    const slotsUsados = objetos.reduce((total, obj) => {
      const slots = Number(obj.system.slots || 0);
      const cantidad = Number(obj.system.cantidad || 1);

      return total + (slots * cantidad);
    }, 0);

    const slotsMaximos = Number(this.actor.system.inventarioMaxSlots || 0);

    context.inventario = {
      usados: slotsUsados,
      maximos: slotsMaximos,
      libres: Math.max(0, slotsMaximos - slotsUsados)
    };

    return context;
  }

  async _onDrop(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el GM puede mover o agregar objetos.");
      return false;
    }

    let data;

    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      console.error("MtRol | Drop inválido", err);
      return false;
    }

    if (data.type !== "Item") return false;

    const item = await Item.implementation.fromDropData(data);

    if (!item) {
      ui.notifications.warn("No se pudo leer el objeto arrastrado.");
      return false;
    }

    const itemData = item.toObject();

    if (itemData.type === "item") {
      itemData.type = "objeto";
    }

    itemData.system = {
      tipoObjeto: itemData.system?.tipoObjeto ?? "general",
      cantidad: itemData.system?.cantidad ?? 1,
      slots: itemData.system?.slots ?? 1,
      equipable: itemData.system?.equipable ?? false,
      equipado: false,
      slot: itemData.system?.slot ?? "",
      defensa: itemData.system?.defensa ?? 0,
      defensaBase: itemData.system?.defensaBase ?? itemData.system?.defensa ?? 0,
      danio: itemData.system?.danio ?? "",
      valor: itemData.system?.valor ?? 0,
      descripcion: itemData.system?.descripcion ?? itemData.system?.description ?? ""
    };

    await this.actor.createEmbeddedDocuments("Item", [itemData]);

    ui.notifications.info(`Objeto agregado: ${item.name}`);

    this.render(true);
    return true;
  }

  async _updateObject(event, formData) {
    if (!game.user.isGM) {
      const recursosBloqueados = [
        "system.recursos.nivel",
        "system.recursos.exp",
        "system.recursos.doblones",
        "system.recursos.mvp",
        "system.recursos.estres",
        "system.recursos.corrupcion"
      ];

      for (const key of Object.keys(formData)) {
        if (key.startsWith("system.atributos.")) delete formData[key];
        if (recursosBloqueados.includes(key)) delete formData[key];
      }
    }

    return super._updateObject(event, formData);
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".mtrol-roll-atributo")
      .off("click")
      .on("click", this._onRollAtributo.bind(this));

    html.find(".add-competencia")
      .off("click")
      .on("click", this._onAddCompetencia.bind(this));

    html.find(".add-habilidad-combate")
  .off("click")
  .on("click", this._onAddHabilidadCombate.bind(this));

    html.find(".habilidad-combate-equip")
  .off("click")
  .on("click", this._onEquiparHabilidadCombate.bind(this));

      html.find(".habilidad-combate-unequip")
  .off("click")
  .on("click", this._onDesequiparHabilidadCombate.bind(this));

    html.find(".competencia-up")
      .off("click")
      .on("click", this._onCompetenciaUp.bind(this));

    html.find(".competencia-down")
      .off("click")
      .on("click", this._onCompetenciaDown.bind(this));

    html.find(".competencia-roll")
      .off("click")
      .on("click", this._onCompetenciaRoll.bind(this));

    html.find(".mtrol-restaurar-dia")
      .off("click")
      .on("click", this._onRestaurarDia.bind(this));

    html.find(".item-create-objeto")
      .off("click")
      .on("click", this._onCreateObjeto.bind(this));

    html.find(".item-edit")
      .off("click")
      .on("click", this._onEditItem.bind(this));

    html.find(".item-delete")
      .off("click")
      .on("click", this._onDeleteItem.bind(this));

    html.find(".item-equip")
      .off("click")
      .on("click", this._onEquipItem.bind(this));

    html.find(".item-unequip")
      .off("click")
      .on("click", this._onUnequipItem.bind(this));
  }

  async _onRestaurarDia(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el GM puede restaurar el día.");
      return;
    }

    await this.actor.unsetFlag("mtrol", "mpStacks");

    ui.notifications.info(`Día restaurado para ${this.actor.name}.`);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<strong>🌙 ${this.actor.name}</strong> ha restaurado el día. Los costes acumulados de MP fueron reiniciados.`
    });

    this.render(true);
  }

  async _onRollAtributo(event) {
    event.preventDefault();

    const attr = event.currentTarget.dataset.atributo || event.currentTarget.dataset.attr;
    if (!attr) return;

    const fxData = FX_ATRIBUTOS[attr] ?? {
      label: this._capitalizar(attr),
      file: null
    };

    const valor = Number(this.actor.system.atributos?.[attr] ?? 0);
    const formula = `1d10 + ${valor}`;

    await mtrolRoll(
      formula,
      this.actor,
      `⚔️ Tirada de ${fxData.label}: ${formula.replaceAll("d", "D")}`
    );

    await this._playAtributoFX(attr, fxData);
  }

  async _playAtributoFX(attr, fxData) {
    try {
      if (!game.modules.get("sequencer")?.active) {
        console.warn("MtRol | Sequencer no está activo. No se puede ejecutar FX.");
        return;
      }

      if (!fxData?.file) {
        console.warn(`MtRol | No hay FX configurado para el atributo: ${attr}`);
        return;
      }

      const token = this.actor.getActiveTokens()[0];

      if (!token) {
        ui.notifications.warn("Colocá un token de este actor en la escena para ver el FX.");
        return;
      }

      await new Sequence()
        .effect()
        .file(fxData.file)
        .atLocation(token)
        .scale(0.8)
        .fadeIn(500)
        .fadeOut(500)
        .duration(5000)
        .play();

    } catch (error) {
      console.error("MtRol | Error ejecutando FX de atributo:", error);
    }
  }

  async _onAddCompetencia(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede crear competencias.");
      return;
    }

    await this.actor.createEmbeddedDocuments("Item", [{
      name: "Nueva competencia",
      type: "competencia",
      system: {
        nivel: 1,
        fx: {
          visual: "",
          sonido: "",
          duracion: 5000,
          escala: 1
        },
        descripcion: ""
      }
    }]);

    this.render(true);
  }

  async _onCompetenciaUp(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede subir competencias.");
      return;
    }

    const item = this._getItemFromEvent(event);
    if (!item) return;

    const nivelActual = Number(item.system.nivel || 1);
    const nivelNuevo = Math.min(5, nivelActual + 1);

    await item.update({ "system.nivel": nivelNuevo });

    this.render(true);
  }

  async _onCompetenciaDown(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede bajar competencias.");
      return;
    }

    const item = this._getItemFromEvent(event);
    if (!item) return;

    const nivelActual = Number(item.system.nivel || 1);
    const nivelNuevo = Math.max(1, nivelActual - 1);

    await item.update({ "system.nivel": nivelNuevo });

    this.render(true);
  }

  async _onCompetenciaRoll(event) {
  event.preventDefault();
  event.stopPropagation();

  const item = this._getItemFromEvent(event);

  if (!item) {
    ui.notifications.warn("No se encontró la competencia.");
    return;
  }

  if (item.type !== "competencia") {
    console.warn("MtRol | El botón de competencia no pertenece a una competencia:", item);
    return;
  }

  const actor = this.actor;
const nivel = Number(item.system?.nivel ?? 1);

const targetToken = Array.from(game.user.targets)[0] ?? null;
const targetActor = targetToken?.actor ?? null;

const esHabilidadCombate =
  item.system?.categoria === "combate" ||
  item.system?.tipo === "habilidad-combate";

if (esHabilidadCombate && !targetToken) {
  ui.notifications.warn("Seleccioná un objetivo antes de usar una habilidad de combate.");
  return;
}

  const formula = item.system?.formula?.trim()
    ? item.system.formula.trim()
    : this._formulaCompetenciaPorNivel(nivel);
   // =========================
// CONSUMO DE MP + STACKING
// =========================

const esPasiva =
  item.system?.categoria === "pasiva" ||
  item.system?.tipo === "pasiva";

const consumeMP =
  !esPasiva;

let costoTotal = 0;

if (consumeMP) {

  const mpActual = Number(actor.system.vitales?.mp?.value ?? 0);

  const stacks = foundry.utils.duplicate(
    actor.getFlag("mtrol", "mpStacks") ?? {}
  );

  const stackKey = item.id;
  const usosPrevios = Number(stacks[stackKey] ?? 0);

  const costoBasico = 1;

  const costeBaseHabilidad =
    Number(item.system?.costeMP ?? 1);

  const costoCompetencia =
    costeBaseHabilidad + usosPrevios;

 costoTotal =
  costoBasico + costoCompetencia;

  if (mpActual < costoTotal) {
    ui.notifications.warn(
      `${actor.name} no tiene suficiente MP. Necesita ${costoTotal} MP.`
    );
    return;
  }

  stacks[stackKey] = usosPrevios + 1;

  await actor.update({
    "system.vitales.mp.value": mpActual - costoTotal
  });

  await actor.setFlag("mtrol", "mpStacks", stacks);

  const targetText = targetActor
    ? ` contra <strong>${targetActor.name}</strong>`
    : "";



}
    // =========================
    // FX DE COMPETENCIA
    // =========================

  await this._playCompetenciaFX(item, targetToken);

// =========================
// HABILIDAD DE BARRA
// =========================

const esSkillBar =
  item.system?.tipo === "habilidad-combate";

// =========================
// TIRADA DE COMPETENCIA / DAÑO
// =========================

const danioFormula =
  item.system?.danio?.trim() ?? "";

// =========================
// TIRADA PRINCIPAL
// =========================

let resultadoCompetencia = null;

if (esSkillBar) {

  console.log(
    "MTROL | SkillBar item:",
    item.name,
    item.id,
    item.system
  );

  const formulaManual =
    item.system?.formula?.toString().trim() ||
    item.system?.formulaTirada?.toString().trim() ||
    item.getFlag("mtrol", "formulaManual") ||
    "";

  console.log("MTROL | formulaManual:", formulaManual);

  if (formulaManual) {

    resultadoCompetencia = await mtrolRoll(
      formulaManual,
      actor,
      `🔥 ${item.name}`
    );

  } else if (danioFormula) {

    resultadoCompetencia = {
      pifia: false,
      soloDanio: true
    };

  } else {

    ui.notifications.warn(
      `${item.name} no tiene Fórmula de Tirada ni Fórmula de Daño configurada.`
    );
    return;

  }

} else {

  resultadoCompetencia = await mtrolRoll(
    formula,
    actor,
    `⚔️ Competencia: ${item.name} | Nivel ${nivel}`
  );

}

// =========================
// TIRADA DE DAÑO
// =========================

if (esHabilidadCombate && targetActor && danioFormula) {

  if (resultadoCompetencia?.pifia) {
    ui.notifications.warn(
      `${item.name} terminó en PIFIA. No se aplica daño.`
    );
    return;
  }

  // =========================
  // DATOS DE DAÑO DE ARMAS EQUIPADAS
  // =========================

  const rollData = actor.getRollData();

  rollData.danio = rollData.danio ?? {};

  const armaIzqId =
    actor.system.equipamiento?.manoIzq ?? "";

  const armaDerId =
    actor.system.equipamiento?.manoDer ?? "";

  const armaIzq =
    armaIzqId ? actor.items.get(armaIzqId) : null;

  const armaDer =
    armaDerId ? actor.items.get(armaDerId) : null;

  rollData.danio.mizq =
    armaIzq?.system?.danio?.toString().trim()
      ? armaIzq.system.danio.toString().trim()
      : "0";

  rollData.danio.mder =
    armaDer?.system?.danio?.toString().trim()
      ? armaDer.system.danio.toString().trim()
      : "0";

  rollData.manoIzquierda = rollData.danio.mizq;
  rollData.manoDerecha = rollData.danio.mder;

  rollData.mano =
    Number(rollData.danio.mder || 0) > 0
      ? rollData.danio.mder
      : rollData.danio.mizq;

  // =========================
  // NORMALIZAR FÓRMULA DE DAÑO
  // =========================

  const formulaDanioFinal =
    danioFormula
      .replaceAll("x", "*")
      .replaceAll("X", "*");

  // =========================
  // DEBUG TEMPORAL DAÑO
  // =========================

  console.log("MTROL | formulaDanioFinal:", formulaDanioFinal);
  console.log("MTROL | armaIzq:", armaIzq?.name, armaIzq?.system?.danio);
  console.log("MTROL | armaDer:", armaDer?.name, armaDer?.system?.danio);
  console.log("MTROL | rollData.danio:", rollData.danio);
  console.log("MTROL | rollData.mano:", rollData.mano);

  // =========================
  // TIRADA DE DAÑO
  // =========================

  const damageRoll = await new Roll(
    formulaDanioFinal,
    rollData
  ).evaluate();

  // =========================
  // DICE SO NICE
  // =========================


  const damageTotal = Number(damageRoll.total ?? 0);

  // =========================
  // DAÑO LOCALIZADO CENTRALIZADO
  // =========================

  const resultadoDanio = await aplicarDanioLocalizado(
    targetActor,
    damageTotal
  );

  if (!resultadoDanio) return;

  const damageFormulaVisual =
    damageRoll.formula.replaceAll("d", "D");

    const damageRollHTML =
  await damageRoll.render({
    flavor: "⚔️ Tirada de Daño"
  });

const localizacionRollHTML =
  await resultadoDanio.localizacionRoll.render({
    flavor: "🎯 Tirada de Localización"
  });

  // =========================
  // MUERTE AUTOMÁTICA
  // =========================

  if (resultadoDanio.hpNuevo <= 0) {

    if (targetToken?.document) {
      await targetToken.document.update({
        overlayEffect: "icons/svg/skull.svg"
      });
    }
  }
// =========================
// CHAT CARD UNIFICADA
// =========================

const objetivoMuerto =
  resultadoDanio.hpNuevo <= 0;

const armaduraDestruida =
  resultadoDanio.itemDestruido;

const targetTextCombat =
  targetActor
    ? `<strong>${targetActor.name}</strong>`
    : "Sin objetivo";

await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor }),
  rolls: [
    damageRoll,
    resultadoDanio.localizacionRoll
  ],
  content: `

          <div class="mtrol-combat-card">
          <div class="mtrol-combat-header">

      <div class="mtrol-combat-subheader">
        <strong>${actor.name}</strong>
        →
        ${targetTextCombat}
      </div>

      <hr>

      <div class="mtrol-combat-section">

 <div class="mtrol-roll-block">
  ${damageRollHTML}
</div>

<div class="mtrol-roll-block">
  ${localizacionRollHTML}
</div>

<p>
  🎲 Dado de localización:
  <strong>D10 = ${resultadoDanio.numeroLocalizacion}</strong>
</p>

  <p>
    🎯 Zona impactada:
    <strong>${resultadoDanio.zona}</strong>
  </p>

        <p>
          ⚔️ Daño original:
          <strong>${resultadoDanio.danioOriginal}</strong>
        </p>

        <p>
          🛡️ Armadura:
          <strong>${resultadoDanio.item ?? "Sin armadura"}</strong>
        </p>

        <p>
          🛡️ Defensa:
          <strong>${resultadoDanio.defensaInicial}</strong>
          →
          <strong>${resultadoDanio.defensaFinal}</strong>
        </p>

        <p>
          💥 Daño absorbido:
          <strong>${resultadoDanio.danioAbsorbido}</strong>
        </p>

        <p>
          ❤️ HP perdido:
          <strong>${resultadoDanio.hpPerdido}</strong>
        </p>

        <p>
          ❤️ HP:
          <strong>${resultadoDanio.hpAnterior}</strong>
          →
          <strong>${resultadoDanio.hpNuevo}</strong>
        </p>

        <hr>

        <p>
          🔷 MP consumido:
          <strong>${costoTotal}</strong>
        </p>

        ${
          armaduraDestruida
            ? `
              <div class="mtrol-combat-alert destroy">
                ☠️ ${resultadoDanio.item} fue destruido
              </div>
            `
            : ""
        }

        ${
          objetivoMuerto
            ? `
              <div class="mtrol-combat-alert death">
                ☠️ ${targetActor.name} ha muerto
              </div>
            `
            : ""
        }

      </div>
    </div>
  `
});
}
}



  



  async _onAddHabilidadCombate(event) {
  event.preventDefault();

  if (!game.user.isGM) {
    ui.notifications.warn(
      "Solo el Game Master puede crear habilidades de combate."
    );
    return;
  }

  await this.actor.createEmbeddedDocuments("Item", [{
    name: "Nueva habilidad de combate",
    type: "competencia",

    system: {
      nivel: 1,

      categoria: "combate",

      equipadaCombate: false,

      formula: "",
      danio: "",

      atributo: "",

      tipo: "habilidad-combate",

      costeMP: 1,

      usaDanioLocalizado: false,

      fx: {
  visual: "",
  autocast: "",
  proyectil: "",
  target: "",
  sonido: "",
  duracion: 5000,
  escala: 1
},

      descripcion: ""
    }
  }]);

  this.render(true);
}

async _onEquiparHabilidadCombate(event) {
  event.preventDefault();

  if (!game.user.isGM) {
    ui.notifications.warn(
      "Solo el Game Master puede equipar habilidades."
    );
    return;
  }

  const item = this._getItemFromEvent(event);

  if (!item) return;

  await item.update({
    "system.equipadaCombate": true
  });

  this.render(true);
}

async _onDesequiparHabilidadCombate(event) {
  event.preventDefault();

  if (!game.user.isGM) {
    ui.notifications.warn(
      "Solo el Game Master puede desequipar habilidades."
    );
    return;
  }

  const item = this._getItemFromEvent(event);

  if (!item) return;

  await item.update({
    "system.equipadaCombate": false
  });

  this.render(true);
}

async _playCompetenciaFX(item, targetToken = null) {
  try {
    if (!game.modules.get("sequencer")?.active) {
      console.warn("MtRol | Sequencer no está activo. No se puede ejecutar FX de competencia.");
      return;
    }

    const fx = item.system?.fx ?? {};

    const fxAutocast = fx.autocast ?? "";
    const fxProyectil = fx.proyectil ?? "";
    const fxTarget = fx.target ?? "";
    const fxLegacy = fx.visual ?? "";
    const fxSonido = fx.sonido ?? "";

    const duracion = Number(fx.duracion ?? 5000);
    const escala = Number(fx.escala ?? 1);

    const casterToken = this.actor.getActiveTokens()[0];

    if (!casterToken) {
      ui.notifications.warn("Colocá un token de este actor en la escena para ver el FX.");
      return;
    }

    const seq = new Sequence();

    // =========================
    // SONIDO
    // =========================
    if (fxSonido) {
      seq.sound()
        .file(fxSonido)
        .volume(0.6);
    }

    // =========================
    // FX SOBRE CASTER
    // =========================
    if (fxAutocast) {
      seq.effect()
        .file(fxAutocast)
        .atLocation(casterToken)
        .scale(escala)
        .fadeIn(300)
        .fadeOut(300)
        .duration(duracion);
    }

    // =========================
    // FX PROYECTIL / TRAYECTORIA
    // =========================
    if (fxProyectil && targetToken) {
      seq.effect()
        .file(fxProyectil)
        .atLocation(casterToken)
        .stretchTo(targetToken)
        .scale(escala);
    }

    // =========================
    // FX SOBRE TARGET
    // =========================
    if (fxTarget && targetToken) {
      seq.effect()
        .file(fxTarget)
        .atLocation(targetToken)
        .scale(escala)
        .fadeIn(300)
        .fadeOut(300)
        .duration(duracion);
    }

    // =========================
    // FALLBACK LEGACY
    // =========================
    if (!fxAutocast && !fxProyectil && !fxTarget && fxLegacy) {
      seq.effect()
        .file(fxLegacy)
        .atLocation(targetToken ?? casterToken)
        .scale(escala)
        .fadeIn(300)
        .fadeOut(300)
        .duration(duracion);
    }

    await seq.play();

  } catch (error) {
    console.error("MtRol | Error ejecutando FX de competencia:", error);
  }
}

  async _onCreateObjeto(event) {
    event.preventDefault();

    await this.actor.createEmbeddedDocuments("Item", [{
      name: "Nuevo objeto",
      type: "objeto",
      system: {
        tipoObjeto: "general",
        cantidad: 1,
        slots: 1,
        equipable: false,
        equipado: false,
        slot: "",
        defensa: 0,
        defensaBase: 0,
        danio: "",
        valor: 0,
        descripcion: ""
      }
    }]);

    this.render(true);
  }

  async _onEditItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;

    if (item.sheet) item.sheet.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede eliminar elementos.");
      return;
    }

    if ((item.type === "objeto" || item.type === "item") && item.system.equipado && item.system.slot) {
      await this.actor.update({
        [`system.equipamiento.${item.system.slot}`]: ""
      });
    }

    await item.delete();

    this.render(true);
  }

  async _onEquipItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;
    if (item.type !== "objeto" && item.type !== "item") return;

    if (!item.system.equipable) {
      ui.notifications.warn("Este objeto no es equipable.");
      return;
    }

    const slot = item.system.slot;

    if (!slot) {
      ui.notifications.warn("Este objeto no tiene un slot asignado.");
      return;
    }

    const slotsValidos = [
      "cabeza",
      "cuello",
      "hombros",
      "brazos",
      "pecho",
      "piernas",
      "pies",
      "manoIzq",
      "manoDer",
      "extra"
    ];

    if (!slotsValidos.includes(slot)) {
      ui.notifications.warn("El slot asignado al objeto no es válido.");
      return;
    }

    const ocupadoId = this.actor.system.equipamiento?.[slot];

    if (ocupadoId && ocupadoId !== item.id) {
      const itemOcupado = this.actor.items.get(ocupadoId);

      if (itemOcupado) {
        await itemOcupado.update({
          "system.equipado": false
        });
      }
    }

    await this.actor.update({
      [`system.equipamiento.${slot}`]: item.id
    });

    await item.update({
      "system.equipado": true
    });

    this.render(true);
  }
  

  async _onUnequipItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;
    if (item.type !== "objeto" && item.type !== "item") return;

    const slot = item.system.slot;

    if (slot) {
      await this.actor.update({
        [`system.equipamiento.${slot}`]: ""
      });
    }

    await item.update({
      "system.equipado": false
    });

    this.render(true);
  }

  _getItemFromEvent(event) {
    const directId = event.currentTarget?.dataset?.itemId;

    if (directId) {
      return this.actor.items.get(directId) ?? null;
    }

    const parent = event.currentTarget.closest("[data-item-id]");

    if (!parent) return null;

    const itemId = parent.dataset.itemId;

    if (!itemId) return null;

    return this.actor.items.get(itemId) ?? null;
  }

  _formulaCompetenciaPorNivel(nivel) {
    switch (nivel) {
      case 1: return "1d4 + 1";
      case 2: return "1d6 + 2";
      case 3: return "1d8 + 3";
      case 4: return "1d10 + 4";
      case 5: return "1d12 + 5";
      default: return "1d4 + 1";
    }
  }

  _capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  _capitalizarSlot(slot) {
    const labels = {
      cabeza: "Cabeza",
      cuello: "Cuello",
      hombros: "Hombros",
      brazos: "Brazos",
      pecho: "Pecho",
      piernas: "Piernas",
      pies: "Pies",
      manoIzq: "Mano Izquierda",
      manoDer: "Mano Derecha",
      extra: "Extra"
    };

    return labels[slot] || slot;
  }
}

