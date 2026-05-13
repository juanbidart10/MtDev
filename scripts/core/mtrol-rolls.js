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

  const rollHTML = await roll.render();
  const rollHTMLLimpio = rollHTML.replace(
    /<div class="dice-formula">[\s\S]*?<\/div>/,
    ""
  );

  let totalExtra = 0;
  const detalles = [];

  for (const die of roll.dice ?? []) {
    for (const result of die.results ?? []) {
      if (result.active === false) continue;

      const caras = die.faces;
      const valor = Number(result.result);

      if (valor === 2) {
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
      detalles.push(`🎯 Crítico en d${caras}`);

      while (true) {
        const extraRoll = await new Roll(`1d${caras}`).evaluate();
        todosLosRolls.push(extraRoll);

        if (game.dice3d) {
          await game.dice3d.showForRoll(extraRoll, game.user, true);
        }

        const extraValor = Number(extraRoll.total);

        detalles.push(`↳ d${caras}: ${extraValor} x${multiplicador}`);

        if (extraValor === 2) {
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

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
       content: `
      <div class="mtrol-chat-card mtrol-chat-success">

        <h2>${flavor}</h2>

        <div class="mtrol-formula-box">
          ⚔️ ${formulaVisualFinal}
        </div>

        <hr>

       <div class="mtrol-simple-result">
  ${roll.total}
</div>

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