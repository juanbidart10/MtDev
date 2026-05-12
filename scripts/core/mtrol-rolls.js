export async function mtrolRoll(formula, actor, flavor = "Tirada MtRol") {
  if (!actor) {
    ui.notifications.warn("MtRol | No hay actor para la tirada.");
    return null;
  }

  const data = actor.getRollData ? actor.getRollData() : {};

  data.atributos = actor.system?.atributos ?? {};
  data.recursos = actor.system?.recursos ?? {};
  data.vitales = actor.system?.vitales ?? {};

  const roll = await new Roll(formula, data).evaluate({ async: true });

  if (game.dice3d) {
    await game.dice3d.showForRoll(roll, game.user, true);
  }

  const rollHTML = await roll.render();

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
            <div style="text-align:center; font-size:18px; padding:10px;">
              💀 <strong>PIFIA</strong> 💀
              <br>
              El dado mostró un 2.
            </div>
            ${rollHTML}
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
        const extraRoll = await new Roll(`1d${caras}`).evaluate({ async: true });

        if (game.dice3d) {
          await game.dice3d.showForRoll(extraRoll, game.user, true);
        }

        const extraValor = Number(extraRoll.total);

        detalles.push(`↳ d${caras}: ${extraValor} x${multiplicador}`);

        if (extraValor === 2) {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `
              <div style="text-align:center; font-size:18px; padding:10px;">
                💀 <strong>PIFIA</strong> 💀
                <br>
                La tirada fue cancelada durante la cadena crítica.
              </div>
              ${rollHTML}
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
      <div>
        <strong>${flavor}</strong>
        <br>
        Fórmula: <code>${formulaVisual}</code>
        <hr>
        ${rollHTML}
        <hr>
        Resultado base ajustado: <strong>${totalBase}</strong>
        ${detalles.length ? `<hr>${detalles.join("<br>")}` : ""}
        <hr>
        Total final: <strong>${totalFinal}</strong>
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