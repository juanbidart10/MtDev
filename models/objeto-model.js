const fields = foundry.data.fields;

export class ObjetoDataModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {
    return {

      tipoObjeto: new fields.StringField({
        initial: "general"
      }),

      cantidad: new fields.NumberField({
        initial: 1,
        integer: true,
        min: 0
      }),

      slots: new fields.NumberField({
        initial: 1,
        integer: true,
        min: 0
      }),

      equipable: new fields.BooleanField({
        initial: false
      }),

      equipado: new fields.BooleanField({
        initial: false
      }),

      slot: new fields.StringField({
        initial: ""
      }),

      // Defensa actual del objeto.
      // Esta baja cuando recibe daño.
      // Si llega a 0, el objeto se destruye.
      defensa: new fields.NumberField({
        initial: 0,
        integer: true,
        min: 0
      }),

      // Defensa máxima/original del objeto.
      // Sirve como referencia para reparación o visualización.
      defensaBase: new fields.NumberField({
        initial: 0,
        integer: true,
        min: 0
      }),

      danio: new fields.StringField({
        initial: ""
      }),

      valor: new fields.NumberField({
        initial: 0,
        integer: true,
        min: 0
      }),

      descripcion: new fields.StringField({
        initial: ""
      }),

      // Se mantiene por compatibilidad visual/lógica futura.
      // Pero la regla principal será:
      // defensa = 0 => item eliminado.
      roto: new fields.BooleanField({
        initial: false
      })

    };
  }

}