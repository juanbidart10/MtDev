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

export const MTROL_BODY_LABELS = {
  cabeza: "Cabeza",
  cuello: "Cuello",
  hombros: "Hombros",
  brazos: "Brazos",
  pecho: "Pecho",
  piernas: "Piernas",
  pies: "Pies",
  manoIzq: "Mano izquierda",
  manoDer: "Mano derecha",
  extra: "Zona crítica"
};

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  const n = Number(String(value).replace(",", "."));

  return Number.isFinite(n) ? n : 0;
}

export async function aplicarDanioLocalizado(actorObjetivo, danio) {
  if (!actorObjetivo) {
    ui.notifications.warn("MtRol | No se encontró actor objetivo.");
    return null;
  }

  const danioFinal =
    Math.max(0, toNumber(danio));

  // =========================
  // TIRADA ÚNICA DE LOCALIZACIÓN
  // =========================

  const localizacionRoll =
    await new Roll("1d10").evaluate();



  const numeroLocalizacion =
    Number(localizacionRoll.total ?? 5);

  const slotObjetivo =
    MTROL_BODY_SLOTS[numeroLocalizacion] ?? "pecho";

  const labelLocalizacion =
    MTROL_BODY_LABELS[slotObjetivo] ?? slotObjetivo;

  const itemId =
    actorObjetivo.system?.equipamiento?.[slotObjetivo] ?? "";

  const item =
    itemId ? actorObjetivo.items.get(itemId) : null;

  const resultado = {
    localizacionRoll,
    numeroLocalizacion,
    slot: slotObjetivo,
    zona: labelLocalizacion,
    item: item?.name ?? null,
    defensaInicial: 0,
    defensaFinal: 0,
    danioOriginal: danioFinal,
    danioAbsorbido: 0,
    hpPerdido: 0,
    itemDestruido: false,
    hpAnterior: Number(actorObjetivo.system?.vitales?.hp?.value ?? 0),
    hpNuevo: Number(actorObjetivo.system?.vitales?.hp?.value ?? 0)
  };

  if (danioFinal <= 0) {
    return resultado;
  }

  // =========================
  // SIN ARMADURA EN LA ZONA
  // =========================

  if (!item) {
    const hpNuevo =
      Math.max(0, resultado.hpAnterior - danioFinal);

    await actorObjetivo.update({
      "system.vitales.hp.value": hpNuevo
    });

    resultado.hpPerdido = danioFinal;
    resultado.hpNuevo = hpNuevo;

    return resultado;
  }

  // =========================
  // CON ARMADURA EN LA ZONA
  // =========================

  const defensaActual =
    Math.max(0, toNumber(item.system?.defensa ?? 0));

  resultado.defensaInicial = defensaActual;

  const danioAbsorbido =
    Math.min(defensaActual, danioFinal);

  const danioSobrante =
    Math.max(0, danioFinal - defensaActual);

  const defensaNueva =
    Math.max(0, defensaActual - danioFinal);

  resultado.danioAbsorbido = danioAbsorbido;
  resultado.defensaFinal = defensaNueva;
  resultado.hpPerdido = danioSobrante;

  if (defensaNueva <= 0) {
    resultado.itemDestruido = true;

    await actorObjetivo.update({
      [`system.equipamiento.${slotObjetivo}`]: ""
    });

    await item.delete();

  } else {
    await item.update({
      "system.defensa": defensaNueva
    });
  }

  if (danioSobrante > 0) {
    const hpNuevo =
      Math.max(0, resultado.hpAnterior - danioSobrante);

    await actorObjetivo.update({
      "system.vitales.hp.value": hpNuevo
    });

    resultado.hpNuevo = hpNuevo;
  }

  return resultado;
}