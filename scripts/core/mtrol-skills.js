// ==========================================
// MTROL SKILLS DATABASE
// ==========================================

const MTROL_SKILLS = {

  // ======================================
  // Daño Fisico
  // Fuerza + Destreza
  // Consume MP fijo, NO stackea
  // Aplica daño localizado
  // ======================================

  "Daño Fisico": {
    nombre: "Ataque",
    tipo: "fisico",
    categoria: "danio",

    atributos: ["fuerza", "destreza"],
    formula: "1d10 + @atributos.fuerza + @atributos.destreza",

    usaArmas: true,

    consumeMP: true,
    costoMPBase: 1,
    usaStackMP: false,

    ejecutaDanio: true,
    usaDanioLocalizado: true,

    permiteDefensa: true,
    permiteContraataque: true,
    permiteEsquivar: true,

    usaAlineamiento: false,

    fx: {},
    sound: {}
  },

  // ======================================
  // DEFENSA
  // Fuerza + Resistencia
  // Consume MP fijo, NO stackea
  // NO aplica daño localizado
  // ======================================

  "defensa": {
    nombre: "Defensa",
    tipo: "defensivo",
    categoria: "reaccion",

    atributos: ["fuerza", "resistencia"],
    formula: "1d10 + @atributos.fuerza + @atributos.resistencia",

    usaArmas: false,

    consumeMP: true,
    costoMPBase: 1,
    usaStackMP: false,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: false,
    permiteContraataque: false,
    permiteEsquivar: false,

    usaAlineamiento: false,

    fx: {},
    sound: {}
  },

  // ======================================
  // CONTRAATAQUE
  // Carisma + Percepción
  // Consume MP fijo, NO stackea
  // Puede aplicar daño localizado si gana
  // ======================================

"contraataque": {

  nombre: "Contraataque",

  tipo: "fisico",
  categoria: "reaccion",

  atributos: [
    "carisma",
    "percepcion"
  ],

  formula:
    "1d10 + @atributos.carisma + @atributos.percepcion",

  usaArmas: false,

  consumeMP: true,
  costoMPBase: 5,
  usaStackMP: false,

  ejecutaDanio: false,
  usaDanioLocalizado: false,

  permiteDefensa: false,
  permiteContraataque: false,
  permiteEsquivar: false,

  usaAlineamiento: false,

  // si gana:
  resultadoExitoso: {
    skillDanio: "ataque"
  },

  fx: {},
  sound: {}

},

  // ======================================
  // ESQUIVAR
  // Carisma + Destreza
  // No consume MP fijo, stackea
  // NO aplica daño localizado
  // ======================================

 "esquivar": {

  nombre: "Esquivar",

  tipo: "defensivo",
  categoria: "reaccion",

  atributos: [
    "carisma",
    "destreza"
  ],

  formula:
    "1d10 + @atributos.carisma + @atributos.destreza",

  usaArmas: false,

  consumeMP: true,
  costoMPBase: 1,

  // ✅ CORREGIDO
  usaStackMP: true,

  ejecutaDanio: false,
  usaDanioLocalizado: false,

  permiteDefensa: false,
  permiteContraataque: false,
  permiteEsquivar: false,

  usaAlineamiento: false,

  fx: {},
  sound: {}

},

  // ======================================
  // DAÑO ÁURICO
  // Aura
  // Consume MP fijo, NO stackea
  // Aplica daño localizado
  // ======================================

  "dano-aurico": {
    nombre: "Daño Áurico",
    tipo: "magico",
    categoria: "danio",

    atributos: ["aura"],
    formula: "1d10 + @atributos.aura",

    usaArmas: true,

    consumeMP: true,
    costoMPBase: 1,
    usaStackMP: false,

    ejecutaDanio: true,
    usaDanioLocalizado: true,

    permiteDefensa: false,
    permiteContraataque: false,
    permiteEsquivar: false,

    usaAlineamiento: true,

    fx: {},
    sound: {}
  },

  // ======================================
  // HECHIZO / ATAQUE ESPECIAL
  // D20 + Competencia Base
  // Consume MP fijo, NO stackea
  // NO aplica daño localizado directamente
  // ======================================

  "hechizo": {
    nombre: "Hechizo",
    tipo: "hechizo",
    categoria: "oposicion",

    usaCompetencia: true,
    formula: "null",

    usaArmas: false,

    consumeMP: true,
    costoMPPorNivel: true,
    usaStackMP: false,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: true,
    permiteContraataque: true,
    permiteEsquivar: true,

    usaAlineamiento: true,

    resultadoExitoso: {
      skillDanio: "dano-aurico"
    },

    fx: {},
    sound: {}
  },

  // ======================================
  // COMPETENCIA
  // Dado según nivel + Base
  // Consume MP y SÍ stackea por repetición
  // NO aplica daño localizado por sí sola
  // ======================================

  "competencia": {
    nombre: "Competencia",
    tipo: "competencia",
    categoria: "tirada",

    usaCompetencia: true,
    formula: "@dadosCompetencia + @competencia",

    usaArmas: false,

    consumeMP: true,
    costoMPBase: 1,
    usaStackMP: true,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: false,
    permiteContraataque: false,
    permiteEsquivar: false,

    usaAlineamiento: false,

    fx: {},
    sound: {}
  }

};


// ==========================================
// MAGIA / SISTEMA MÁGICO
// ==========================================

Object.assign(MTROL_SKILLS, {

  // ======================================
  // ATAQUE MÁGICO
  // Aura + Percepción
  // Consume MP fijo
  // NO stackea
  // NO aplica daño directamente
  // Compite contra defensas mágicas
  // ======================================

  "ataque-magico": {

    nombre: "Ataque Mágico",

    tipo: "magico",
    categoria: "oposicion",

    atributos: [
      "aura",
      "percepcion"
    ],

    formula:
      "1d10 + @atributos.aura + @atributos.percepcion",

    usaArmas: false,

    consumeMP: true,
    costoMPBase: 1,
    usaStackMP: false,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: true,
    permiteContraataque: true,
    permiteEsquivar: true,

    usaAlineamiento: true,

    // skill de daño que ejecuta si gana
    resultadoExitoso: {
      skillDanio: "dano-aurico"
    },

    fx: {},
    sound: {}

  },

  // ======================================
  // DEFENSA MÁGICA
  // Aura + Inteligencia
  // Consume MP fijo
  // NO stackea
  // NO aplica daño
  // ======================================

  "defensa-magica": {

    nombre: "Defensa Mágica",

    tipo: "magico",
    categoria: "reaccion",

    atributos: [
      "aura",
      "inteligencia"
    ],

    formula:
      "1d10 + @atributos.aura + @atributos.inteligencia",

    usaArmas: false,

    consumeMP: true,
    costoMPBase: 1,
    usaStackMP: false,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: false,
    permiteContraataque: false,
    permiteEsquivar: false,

    usaAlineamiento: true,

    fx: {},
    sound: {}

  },

  // ======================================
  // CONTRAATAQUE MÁGICO
  // Aura + Percepción
  // Consume MP fijo
  // NO stackea
  // Aplica daño si gana
  // ======================================

  "contraataque-magico": {

  nombre: "Contraataque Mágico",

  tipo: "magico",
  categoria: "reaccion",

  atributos: [
    "aura",
    "percepcion"
  ],

  formula:
    "1d10 + @atributos.aura + @atributos.percepcion",

  usaArmas: false,

  consumeMP: true,
  costoMPBase: 5,
  usaStackMP: false,

  ejecutaDanio: false,
  usaDanioLocalizado: false,

  permiteDefensa: false,
  permiteContraataque: false,
  permiteEsquivar: false,

  usaAlineamiento: true,

  // si gana:
  resultadoExitoso: {
    skillDanio: "dano-aurico"
  },

  fx: {},
  sound: {}

},
  // ======================================
  // ESQUIVAR MÁGICO
  // Aura + Destreza
  // Consume MP fijo
  // NO stackea
  // NO aplica daño
  // ======================================

 "esquivar-magico": {

  nombre: "Esquivar Mágico",

  tipo: "magico",
  categoria: "reaccion",

  atributos: [
    "aura",
    "destreza"
  ],

  formula:
    "1d10 + @atributos.aura + @atributos.destreza",

  usaArmas: false,

  consumeMP: true,
  costoMPBase: 1,

  // ✅ CORREGIDO
  usaStackMP: true,

  ejecutaDanio: false,
  usaDanioLocalizado: false,

  permiteDefensa: false,
  permiteContraataque: false,
  permiteEsquivar: false,

  usaAlineamiento: true,

  fx: {},
  sound: {}

},

  // ======================================
  // HABILIDAD ESPECIAL MÁGICA
  // D20 + Competencia Base
  // Consume MP fijo
  // NO stackea
  // NO aplica daño directamente
  // ======================================

  "habilidad-especial-magica": {

    nombre: "Habilidad Especial Mágica",

    tipo: "hechizo",
    categoria: "oposicion",

    usaCompetencia: true,

    formula:
      "1d20 + @competencia",

    usaArmas: false,

    consumeMP: true,
    costoMPBase: 5,
    usaStackMP: false,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: true,
    permiteContraataque: true,
    permiteEsquivar: true,

    usaAlineamiento: true,

    resultadoExitoso: {
      skillDanio: "dano-aurico"
    },

    fx: {},
    sound: {}

  },
// ======================================
// INICIATIVA
// D10 plano + Destreza MtRol
// ======================================

"iniciativa": {

  nombre: "Iniciativa",

  tipo: "utilidad",
  categoria: "iniciativa",

  consumeMP: false,
  usaStackMP: false,

  ejecutaDanio: false,
  usaDanioLocalizado: false,

  usaArmas: false,
  usaAlineamiento: false,

  // IMPORTANTE
  usaReglasMixtas: true,

  fx: {},
  sound: {}

},
  // ======================================
  // COMPETENCIA MÁGICA
  // Magia + Nivel de Hechizo
  // Consume MP por nivel
  // STACKEA por repetición
  // NO aplica daño directamente
  // ======================================

    "competencia-magica": {

    nombre: "Competencia Mágica",

    tipo: "competencia-magica",
    categoria: "tirada",

    usaCompetencia: true,

    formula:
      "@magia + @nivelHechizo",

    usaArmas: false,

    consumeMP: true,

    // se calcula dinámicamente
    costoMPPorNivel: true,

    usaStackMP: true,

    ejecutaDanio: false,
    usaDanioLocalizado: false,

    permiteDefensa: false,
    permiteContraataque: false,
    permiteEsquivar: false,

    usaAlineamiento: true,

    fx: {},
    sound: {}

  }

});

// ==========================================
// MTROL - CALCULO CENTRAL MP
// ==========================================

function mtrolCalcularCostoMP(actor, item) {

  const categoria =
    item.system?.categoria ?? "competencia";

  const tipo =
    item.system?.tipo ?? "";

  const nivel =
    Number(item.system?.nivel ?? 1);

  const costoBase =
    Number(item.system?.costoMP ?? 1);

  // ======================================
  // STACK GLOBAL ACTUAL
  // ======================================

  const stackActual =
    Number(actor.system?.mpStack ?? 0);

  // ======================================
  // ATRIBUTOS
  // ======================================

  if (categoria === "atributo") {

    return {
      costo: 0,
      stackea: false,
      nuevoStack: stackActual
    };

  }

  // ======================================
  // ATAQUE BASICO
  // ======================================

  if (categoria === "basico") {

    return {
      costo: 1,
      stackea: false,
      nuevoStack: stackActual
    };

  }

  // ======================================
  // HECHIZOS
  // COSTE POR NIVEL
  // ======================================

  if (
    categoria === "hechizo" ||
    tipo === "hechizo"
  ) {

    return {
      costo: nivel,
      stackea: false,
      nuevoStack: stackActual
    };

  }

  // ======================================
  // COMPETENCIAS
  // STACKING PROGRESIVO
  // ======================================

  if (
    categoria === "competencia" ||
    tipo === "competencia"
  ) {

    return {

      // 1 → 2 → 3 → 4...
      costo:
        1 + stackActual,

      stackea: true,

      nuevoStack:
        stackActual + 1

    };

  }

  // ======================================
  // HABILIDADES ESPECIALES
  // ======================================

  if (
    categoria === "combate" ||
    tipo === "habilidadEspecial"
  ) {

    return {
      costo: 5,
      stackea: false,
      nuevoStack: stackActual
    };

  }

  // ======================================
  // CONTRAATAQUES
  // ======================================

  if (
    categoria === "contraataque" ||
    tipo === "contraataque"
  ) {

    return {
      costo: 5,
      stackea: false,
      nuevoStack: stackActual
    };

  }

  // ======================================
  // DEFAULT
  // ======================================

  return {

    costo: costoBase,

    stackea: false,

    nuevoStack:
      stackActual

  };

}

// ==========================================
// MTROL SKILL ENGINE
// ==========================================

Hooks.once("ready", () => {

  game.mtrol = game.mtrol ?? {};

  
  

  // ==========================================
  // MTROL - INICIATIVA COMPLETA
  // Dado plano + Destreza MtRol
  // ==========================================

  game.mtrol.rollInitiative = async function({
    actor = null,
    combatant = null,
    token = null
  } = {}) {

    if (!combatant && game.combat && actor) {
      combatant = game.combat.combatants.find(c => c.actor?.id === actor.id);
    }

    if (!actor && combatant) actor = combatant.actor;
    if (!token && combatant) token = combatant.token;

    if (!actor) {
      ui.notifications.error("MtRol | No se encontró actor para iniciativa.");
      return null;
    }

    // ==============================
    // 1D10 PLANO
    // No Dharma, no Karma, no crit, no pifia
    // ==============================

    const rollPlano = new Roll("1d10");
    await rollPlano.evaluate();

    if (game.dice3d) {
      await game.dice3d.showForRoll(rollPlano, game.user, true);
    }

    // ==============================
    // DESTREZA MTROL
    // Usa motor MtRol completo
    // Crit, pifia, Dharma, Karma
    // ==============================

    const rollDestreza = await game.mtrol.roll(
      "1d10 + @atributos.destreza",
      actor,
      "Destreza para Iniciativa"
    );

    if (!rollDestreza) {
      ui.notifications.error("MtRol | No se pudo resolver Destreza para Iniciativa.");
      return null;
    }

    const total =
      Number(rollPlano.total ?? 0) +
      Number(rollDestreza.total ?? 0);

    // Guardado interno en actor
    await actor.update({
      "system.recursos.iniciativa": total
    });

    // Guardado REAL en Combat Tracker
    if (combatant) {
      await combatant.update({
        initiative: total
      });
    }

    // Chat final SIN rolls para no duplicar Dice So Nice
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor, token }),
      content: `
        <div class="mtrol-chat-card mtrol-chat-success">
          <h2>⚡ Iniciativa</h2>

          <div class="mtrol-formula-box">
            ⚔️ 1D10 Plano + Destreza MtRol
          </div>

          <hr>

          <div class="mtrol-result-line">
            1D10 plano:
            <strong>${rollPlano.total}</strong>
          </div>

          <div class="mtrol-result-line">
            Destreza MtRol:
            <strong>${rollDestreza.total}</strong>
          </div>

          <hr>

          <div class="mtrol-total">
            Total final:
            <strong>${total}</strong>
          </div>
        </div>
      `
    });

    return total;
  };


  // ==========================================
// USE SKILL
// ==========================================

game.mtrol.useSkill = async function({
  actor,
  target = null,
  skill,
  combatant = null
}) {

  const skillData = MTROL_SKILLS[skill];

  if (!skillData) {
    ui.notifications.error(`Skill no encontrada: ${skill}`);
    return;
  }

  if (skill === "iniciativa") {
    return await game.mtrol.rollInitiative({
      actor,
      combatant
    });
  }

  console.log(`Skill ejecutada: ${skill}`);

  // ======================================
  // BUSCAR ITEM REAL DEL ACTOR
  // ======================================

  const item = actor.items.find(i =>
    i.name?.toLowerCase().trim() ===
    skill.toLowerCase().trim()
  );

  // ======================================
  // CALCULO Y CONSUMO MP
  // ======================================

  if (item) {

    const resultadoMP =
      mtrolCalcularCostoMP(actor, item);

    const mpActual =
      Number(actor.system.vitales?.mp?.value ?? 0);

    if (mpActual < resultadoMP.costo) {

      ui.notifications.warn(
        `${actor.name} no tiene suficiente MP.`
      );

      return;
    }

    const nuevoMP =
      Math.max(0, mpActual - resultadoMP.costo);

    await actor.update({
      "system.vitales.mp.value": nuevoMP,
      "system.mpStack": resultadoMP.nuevoStack
    });

    console.log(
      `MtRol | ${actor.name} consumió ${resultadoMP.costo} MP`
    );
  }

  return {
    skill,
    skillData
  };
};

  // ==========================================
  // CONECTAR DADO DEL COMBAT TRACKER
  // ==========================================

  if (!game.mtrol._initiativePatched) {

    game.mtrol._initiativePatched = true;

    Combat.prototype.rollInitiative = async function(ids, options = {}) {

      ids = typeof ids === "string" ? [ids] : ids;

      if (!Array.isArray(ids)) {
        ids = this.combatants.map(c => c.id);
      }

      const results = [];

      for (const id of ids) {

        const combatant = this.combatants.get(id);

        if (!combatant) continue;

        const total = await game.mtrol.rollInitiative({
          combatant,
          actor: combatant.actor,
          token: combatant.token
        });

        if (total !== null) results.push(total);
      }

      await this.setupTurns();

      return results;
    };
  }

});