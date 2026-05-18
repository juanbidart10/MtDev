export class ObjetoSheet extends foundry.appv1.sheets.ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mtrol", "sheet", "objeto"],
      template: "systems/mtrol/templates/items/objeto-sheet.html",
      width: 600,
      height: 620
    });
  }

  getData(options) {
    const context = super.getData(options);

    context.item = this.item;
    context.system = this.item.system;
    context.esGM = game.user.isGM;

    const slotActual = this.item.system.slot ?? "";
    const tipoActual = this.item.system.tipoObjeto ?? "general";

    context.slotsCorporales = [
      { value: "", label: "-", selected: slotActual === "" },
      { value: "cabeza", label: "Cabeza", selected: slotActual === "cabeza" },
      { value: "cuello", label: "Cuello", selected: slotActual === "cuello" },
      { value: "hombros", label: "Hombros", selected: slotActual === "hombros" },
      { value: "brazos", label: "Brazos", selected: slotActual === "brazos" },
      { value: "pecho", label: "Pecho", selected: slotActual === "pecho" },
      { value: "piernas", label: "Piernas", selected: slotActual === "piernas" },
      { value: "pies", label: "Pies", selected: slotActual === "pies" },
      { value: "manoIzq", label: "Mano Izquierda", selected: slotActual === "manoIzq" },
      { value: "manoDer", label: "Mano Derecha", selected: slotActual === "manoDer" },
      { value: "extra", label: "Extra", selected: slotActual === "extra" }
    ];

    context.tiposObjeto = [
      { value: "general", label: "General", selected: tipoActual === "general" },
      { value: "arma", label: "Arma", selected: tipoActual === "arma" },
      { value: "armadura", label: "Armadura", selected: tipoActual === "armadura" },
      { value: "escudo", label: "Escudo", selected: tipoActual === "escudo" },
      { value: "consumible", label: "Consumible", selected: tipoActual === "consumible" },
      { value: "material", label: "Material", selected: tipoActual === "material" },
      { value: "llave", label: "Llave", selected: tipoActual === "llave" },
      { value: "moneda", label: "Moneda", selected: tipoActual === "moneda" }
    ];

    return context;
  }
}