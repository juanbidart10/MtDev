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

      formula: new fields.StringField({
        initial: ""
      }),

      danio: new fields.StringField({
        initial: ""
      }),

      atributo: new fields.StringField({
        initial: ""
      }),

      tipo: new fields.StringField({
        initial: "competencia"
      }),

      costeMP: new fields.NumberField({
        initial: 1,
        integer: true,
        min: 0
      }),

      usaDanioLocalizado: new fields.BooleanField({
        initial: false
      }),

      fx: new fields.SchemaField({
        visual: new fields.StringField({
          initial: ""
        }),

        sonido: new fields.StringField({
          initial: ""
        }),

        duracion: new fields.NumberField({
          initial: 5000,
          integer: true,
          min: 0
        }),

        escala: new fields.NumberField({
          initial: 1,
          min: 0
        })
      }),

      descripcion: new fields.StringField({
        initial: ""
      })

    };
  }

}