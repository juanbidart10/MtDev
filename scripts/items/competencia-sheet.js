export class CompetenciaSheet extends foundry.appv1.sheets.ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mtrol", "sheet", "item-sheet", "competencia-sheet"],
      width: 600,
      height: 700,
      resizable: true
    });
  }

  get template() {
    return "systems/mtrol/templates/items/competencia-sheet.html";
  }

  getData(options) {
    const context = super.getData(options);

    context.item = this.item;
    context.system = this.item.system;
    context.esGM = game.user.isGM;

    return context;
  }
}