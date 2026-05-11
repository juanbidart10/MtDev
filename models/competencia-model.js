const fields = foundry.data.fields;

export class CompetenciaDataModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {
      nivel: new fields.NumberField({
        initial: 1,
        integer: true,
        min: 1,
        max: 5
      }),

      descripcion: new fields.StringField({
        initial: ""
      })
    };
  }

}