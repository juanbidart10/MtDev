export const MTROL_BODY_SLOTS = {
  1: "cabeza",
  2: "cuello",
  3: "hombros",
  4: "brazos",
  5: "pecho",
  6: "piernas",
  7: "pies",
  8: "manoIzq",
  9: "manoDer",
  10: "extra"
};

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export async function aplicarDanioLocalizado(actorObjetivo, danio) {
  if (!actorObjetivo) {
    ui.notifications.warn("No se encontró actor objetivo.");
    return null;
  }

  const danioFinal = Math.max(0, toNumber(danio));

  const localizacionRoll = await new Roll("1d10").evaluate({ async: true });
  const numeroLocalizacion = localizacionRoll.total;
  const slotObjetivo = MTROL_BODY_SLOTS[numeroLocalizacion] ?? "pecho";

  const itemId = actorObjetivo.system?.equipamiento?.[slotObjetivo];
  const item = itemId ? actorObjetivo.items.get(itemId) : null;

  const resultado = {
    slot: slotObjetivo,
    localizacion: numeroLocalizacion,
    item: item?.name ?? null,
    defensaInicial: 0,
    defensaFinal: 0,
    hpPerdido: 0,
    itemDestruido: false
  };

  if (!item) {
    const hpActual = toNumber(actorObjetivo.system?.vitales?.hp?.value ?? 0);
    const hpNuevo = Math.max(0, hpActual - danioFinal);

    await actorObjetivo.update({
      "system.vitales.hp.value": hpNuevo
    });

    resultado.hpPerdido = danioFinal;
    return resultado;
  }

  const defensaActual = toNumber(item.system?.defensa ?? 0);
  resultado.defensaInicial = defensaActual;

  const defensaNueva = defensaActual - danioFinal;

  if (defensaNueva <= 0) {
    const sobrante = Math.abs(defensaNueva);

    resultado.itemDestruido = true;
    resultado.defensaFinal = 0;

    await actorObjetivo.update({
      [`system.equipamiento.${slotObjetivo}`]: ""
    });

    await item.delete();

    if (sobrante > 0) {
      const hpActual = toNumber(actorObjetivo.system?.vitales?.hp?.value ?? 0);
      const hpNuevo = Math.max(0, hpActual - sobrante);

      await actorObjetivo.update({
        "system.vitales.hp.value": hpNuevo
      });

      resultado.hpPerdido = sobrante;
    }

    return resultado;
  }

  await item.update({
    "system.defensa": defensaNueva
  });

  resultado.defensaFinal = defensaNueva;
  resultado.hpPerdido = 0;

  return resultado;
}