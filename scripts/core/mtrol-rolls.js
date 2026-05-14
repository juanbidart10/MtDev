function mtrolSlug(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function mtrolCrearFormulaVisual(formula, etiquetas = {}) {
  let visual = formula;

  for (const [clave, etiqueta] of Object.entries(etiquetas)) {
    visual = visual.replaceAll(`@${clave}`, etiqueta);
  }

  return visual;
}

async function mtrolAplicarDharmaKarma(actor, sumaDharma, sumaKarma) {
  if (!actor) return;
  if (!sumaDharma && !sumaKarma) return;

  const updates = {};

  if (sumaDharma) {
    const actual = Number(actor.system.recursos?.dharma ?? 0);
    const nuevo = Math.min(5, actual + 1);

    updates["system.recursos.dharma"] = nuevo;

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
}

export async function mtrolRoll(formula, actor, flavor = "Tirada MtRol") {
  if (!actor) {
    ui.notifications.warn("MtRol | No hay actor para la tirada.");
    return null;
  }

  const data = actor.getRollData ? actor.getRollData() : {};

  data.atributos = actor.system?.atributos ?? {};
  data.recursos = actor.system?.recursos ?? {};
  data.vitales = actor.system?.vitales ?? {};
  data.competencias = data.competencias ?? {};

  const etiquetas = {
    "atributos.aura": "AURA",
    "atributos.percepcion": "PERCEPCIÓN",
    "atributos.fuerza": "FUERZA",
    "atributos.destreza": "DESTREZA",
    "atributos.inteligencia": "INTELIGENCIA",
    "atributos.voluntad": "VOLUNTAD",
    "atributos.resistencia": "RESISTENCIA",
    "atributos.carisma": "CARISMA",
    "atributos.suerte": "SUERTE"
  };

  for (const item of actor.items ?? []) {
    if (item.type !== "competencia") continue;

    const slug = mtrolSlug(item.name);
    if (!slug) continue;

    const nivel = Number(item.system?.nivel ?? 0);

    data.competencias[slug] = nivel;
    etiquetas[`competencias.${slug}`] = item.name.toUpperCase();
  }

  const formulaVisual = mtrolCrearFormulaVisual(formula, etiquetas);
  const formulaVisualFinal = formulaVisual.replaceAll("d", "D");

  const roll = await new Roll(formula, data).evaluate();
  const todosLosRolls = [roll];

  if (game.dice3d) {
    game.dice3d.showForRoll(roll, game.user, false);
  }

  const rollHTMLLimpio = `
    <div class="mtrol-simple-result">
      ${roll.total}
    </div>
  `;

  let totalExtra = 0;
  const detalles = [];

  let sumaDharma = false;
  let sumaKarma = false;

  for (const die of roll.dice ?? []) {
    for (const result of die.results ?? []) {
      if (result.active === false) continue;

      const caras = die.faces;
      const valor = Number(result.result);

      if (valor === 1) sumaDharma = true;
      if (valor === 2) sumaKarma = true;

      if (valor === 2) {
        await mtrolAplicarDharmaKarma(actor, sumaDharma, sumaKarma);

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `
            <div class="mtrol-chat-card mtrol-chat-pifia">
              <h2>💀 PIFIA 💀</h2>
              <p>El dado mostró un 2.</p>
              ${rollHTMLLimpio}
            </div>
          `
        });

        return {
          pifia: true,
          total: 0,
          roll
        };
      }

      if (valor !== 1) continue;

      let multiplicador = 2;
      detalles.push(`🎯 Crítico en D${caras}`);

      while (true) {
        const extraRoll = await new Roll(`1d${caras}`).evaluate();
        todosLosRolls.push(extraRoll);

        if (game.dice3d) {
          game.dice3d.showForRoll(extraRoll, game.user, false);
        }

        const extraValor = Number(extraRoll.total);

        if (extraValor === 1) sumaDharma = true;
        if (extraValor === 2) sumaKarma = true;

        detalles.push(`↳ D${caras}: ${extraValor} x${multiplicador}`);

        if (extraValor === 2) {
          await mtrolAplicarDharmaKarma(actor, sumaDharma, sumaKarma);

          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `
              <div class="mtrol-chat-card mtrol-chat-pifia">
                <h2>💀 PIFIA 💀</h2>
                <p>La tirada fue cancelada durante la cadena crítica.</p>
                ${rollHTMLLimpio}
              </div>
            `
          });

          return {
            pifia: true,
            total: 0,
            roll
          };
        }

        if (extraValor === 1) {
          multiplicador++;
          continue;
        }

        totalExtra += extraValor * multiplicador;
        break;
      }
    }
  }

  let totalBase = Number(roll.total);

  for (const die of roll.dice ?? []) {
    for (const result of die.results ?? []) {
      if (result.active === false) continue;

      if (Number(result.result) === 1) {
        totalBase -= 1;
      }
    }
  }

  const totalFinal = totalBase + totalExtra;

  await mtrolAplicarDharmaKarma(actor, sumaDharma, sumaKarma);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mtrol-chat-card mtrol-chat-success">

        <h2>${flavor}</h2>

        <div class="mtrol-formula-box">
          ⚔️ ${formulaVisualFinal}
        </div>

        <hr>

        ${rollHTMLLimpio}

        <hr>

        <div class="mtrol-result-line">
          Resultado base ajustado:
          <strong>${totalBase}</strong>
        </div>

        ${
          detalles.length
            ? `
              <hr>
              <div class="mtrol-details">
                ${detalles.join("<br>")}
              </div>
            `
            : ""
        }

        <hr>

        <div class="mtrol-total">
          Total final:
          <strong>${totalFinal}</strong>
        </div>

      </div>
    `
  });

  return {
    pifia: false,
    total: totalFinal,
    roll,
    extra: totalExtra
  };
}