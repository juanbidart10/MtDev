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

      categoria: new fields.StringField({
        initial: "competencia"
      }),

      equipadaCombate: new fields.BooleanField({
        initial: false
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

        // Compatibilidad vieja
        visual: new fields.StringField({
          initial: ""
        }),

        // Nuevo: efecto sobre quien usa la habilidad
        autocast: new fields.StringField({
          initial: ""
        }),

        // Nuevo: efecto que viaja desde caster hacia target
        proyectil: new fields.StringField({
          initial: ""
        }),

        // Nuevo: efecto que explota/aparece sobre el target
        target: new fields.StringField({
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