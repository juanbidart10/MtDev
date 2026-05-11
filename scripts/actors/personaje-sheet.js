export class PersonajeSheet extends foundry.appv1.sheets.ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["mtrol", "sheet", "actor"],
      width: 900,
      height: 700,
      tabs: [{
        navSelector: ".tabs",
        contentSelector: ".sheet-body",
        initial: "personaje"
      }],
      dragDrop: [
        {
          dragSelector: ".item",
          dropSelector: null
        }
      ],
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  getData(options) {
    const context = super.getData(options);

    context.actor = this.actor;
    context.system = this.actor.system;
    context.esGM = game.user.isGM;

    context.competencias = this.actor.items.filter(i => i.type === "competencia");

    const objetos = this.actor.items.filter(i => i.type === "objeto" || i.type === "item");

    context.objetosInventario = objetos.filter(o => !o.system.equipado);
    context.objetosEquipados = objetos.filter(o => o.system.equipado);

    const slotsBase = [
      "cabeza",
      "cuello",
      "hombros",
      "brazos",
      "pecho",
      "piernas",
      "pies",
      "manoIzq",
      "manoDer",
      "extra"
    ];

    context.slotsEquipamiento = slotsBase.map(slotKey => {
      const itemId = this.actor.system.equipamiento?.[slotKey] ?? "";
      const item = itemId ? this.actor.items.get(itemId) : null;

      return {
        key: slotKey,
        label: this._capitalizarSlot(slotKey),
        ocupado: !!item,
        item: item,
        defensa: item?.system?.defensa ?? 0,
        danio: item?.system?.danio ?? ""
      };
    });

    const slotsUsados = objetos.reduce((total, obj) => {
      const slots = Number(obj.system.slots || 0);
      const cantidad = Number(obj.system.cantidad || 1);
      return total + (slots * cantidad);
    }, 0);

    const slotsMaximos = Number(this.actor.system.inventarioMaxSlots || 0);

    context.inventario = {
      usados: slotsUsados,
      maximos: slotsMaximos,
      libres: Math.max(0, slotsMaximos - slotsUsados)
    };

    return context;
  }

  async _onDrop(event) {
    event.preventDefault();

    let data;

    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
    } catch (err) {
      console.error("MtRol | Drop inválido", err);
      return false;
    }

    if (data.type !== "Item") return false;

    const item = await Item.implementation.fromDropData(data);

    if (!item) {
      ui.notifications.warn("No se pudo leer el objeto arrastrado.");
      return false;
    }

    const itemData = item.toObject();

    if (itemData.type === "item") {
      itemData.type = "objeto";
    }

    itemData.system = {
      tipoObjeto: itemData.system?.tipoObjeto ?? "general",
      cantidad: itemData.system?.cantidad ?? 1,
      slots: itemData.system?.slots ?? 1,
      equipable: itemData.system?.equipable ?? false,
      equipado: false,
      slot: itemData.system?.slot ?? "",
      defensa: itemData.system?.defensa ?? 0,
      danio: itemData.system?.danio ?? "",
      valor: itemData.system?.valor ?? 0,
      descripcion: itemData.system?.descripcion ?? itemData.system?.description ?? ""
    };

    await this.actor.createEmbeddedDocuments("Item", [itemData]);

    ui.notifications.info(`Objeto agregado: ${item.name}`);

    this.render(true);
    return true;
  }

  async _updateObject(event, formData) {
    if (!game.user.isGM) {
      const recursosBloqueados = [
        "system.recursos.nivel",
        "system.recursos.exp",
        "system.recursos.doblones",
        "system.recursos.mvp",
        "system.recursos.estres",
        "system.recursos.corrupcion"
      ];

      for (const key of Object.keys(formData)) {
        if (key.startsWith("system.atributos.")) delete formData[key];
        if (recursosBloqueados.includes(key)) delete formData[key];
      }
    }

    return super._updateObject(event, formData);
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".atributo.rollable").click(this._onRollAtributo.bind(this));

    html.find(".add-competencia").click(this._onAddCompetencia.bind(this));
    html.find(".competencia-up").click(this._onCompetenciaUp.bind(this));
    html.find(".competencia-down").click(this._onCompetenciaDown.bind(this));
    html.find(".competencia-roll").click(this._onCompetenciaRoll.bind(this));

    html.find(".mtrol-restaurar-dia").click(this._onRestaurarDia.bind(this));

    html.find(".item-create-objeto").click(this._onCreateObjeto.bind(this));
    html.find(".item-edit").click(this._onEditItem.bind(this));
    html.find(".item-delete").click(this._onDeleteItem.bind(this));
    html.find(".item-equip").click(this._onEquipItem.bind(this));
    html.find(".item-unequip").click(this._onUnequipItem.bind(this));
  }

  async _onRestaurarDia(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el GM puede restaurar el día.");
      return;
    }

    await this.actor.unsetFlag("mtrol", "mpStacks");

    ui.notifications.info(`Día restaurado para ${this.actor.name}.`);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<strong>🌙 ${this.actor.name}</strong> ha restaurado el día. Los costes acumulados de MP fueron reiniciados.`
    });

    this.render(true);
  }

  async _onRollAtributo(event) {
    event.preventDefault();

    const attr = event.currentTarget.dataset.attr;
    if (!attr) return;

    const valor = Number(this.actor.system.atributos?.[attr] ?? 0);
    const roll = await new Roll(`1d10 + ${valor}`).evaluate({ async: true });

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Tirada de ${this._capitalizar(attr)}`
    });
  }

  async _onAddCompetencia(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede crear competencias.");
      return;
    }

    await this.actor.createEmbeddedDocuments("Item", [{
      name: "Nueva competencia",
      type: "competencia",
      system: { nivel: 1 }
    }]);
  }

  async _onCompetenciaUp(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede subir competencias.");
      return;
    }

    const item = this._getItemFromEvent(event);
    if (!item) return;

    const nivelActual = Number(item.system.nivel || 1);
    const nivelNuevo = Math.min(5, nivelActual + 1);

    await item.update({ "system.nivel": nivelNuevo });
  }

  async _onCompetenciaDown(event) {
    event.preventDefault();

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede bajar competencias.");
      return;
    }

    const item = this._getItemFromEvent(event);
    if (!item) return;

    const nivelActual = Number(item.system.nivel || 1);
    const nivelNuevo = Math.max(1, nivelActual - 1);

    await item.update({ "system.nivel": nivelNuevo });
  }

  async _onCompetenciaRoll(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;

    const nivel = Number(item.system.nivel || 1);
    const formula = this._formulaCompetenciaPorNivel(nivel);

    const roll = await new Roll(formula).evaluate({ async: true });

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Competencia: ${item.name} (Nivel ${nivel})`
    });
  }

  async _onCreateObjeto(event) {
    event.preventDefault();

    await this.actor.createEmbeddedDocuments("Item", [{
      name: "Nuevo objeto",
      type: "objeto",
      system: {
        tipoObjeto: "general",
        cantidad: 1,
        slots: 1,
        equipable: false,
        equipado: false,
        slot: "",
        defensa: 0,
        danio: "",
        valor: 0,
        descripcion: ""
      }
    }]);
  }

  async _onEditItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;

    if (item.sheet) item.sheet.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;

    if (!game.user.isGM) {
      ui.notifications.warn("Solo el Game Master puede eliminar elementos.");
      return;
    }

    if ((item.type === "objeto" || item.type === "item") && item.system.equipado && item.system.slot) {
      await this.actor.update({
        [`system.equipamiento.${item.system.slot}`]: ""
      });
    }

    await item.delete();
    this.render(true);
  }

  async _onEquipItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;
    if (item.type !== "objeto" && item.type !== "item") return;

    if (!item.system.equipable) {
      ui.notifications.warn("Este objeto no es equipable.");
      return;
    }

    const slot = item.system.slot;
    if (!slot) {
      ui.notifications.warn("Este objeto no tiene un slot asignado.");
      return;
    }

    const slotsValidos = [
      "cabeza",
      "cuello",
      "hombros",
      "brazos",
      "pecho",
      "piernas",
      "pies",
      "manoIzq",
      "manoDer",
      "extra"
    ];

    if (!slotsValidos.includes(slot)) {
      ui.notifications.warn("El slot asignado al objeto no es válido.");
      return;
    }

    const ocupadoId = this.actor.system.equipamiento?.[slot];

    if (ocupadoId && ocupadoId !== item.id) {
      const itemOcupado = this.actor.items.get(ocupadoId);
      if (itemOcupado) {
        await itemOcupado.update({ "system.equipado": false });
      }
    }

    await this.actor.update({
      [`system.equipamiento.${slot}`]: item.id
    });

    await item.update({ "system.equipado": true });

    this.render(true);
  }

  async _onUnequipItem(event) {
    event.preventDefault();

    const item = this._getItemFromEvent(event);
    if (!item) return;
    if (item.type !== "objeto" && item.type !== "item") return;

    const slot = item.system.slot;
    if (slot) {
      await this.actor.update({
        [`system.equipamiento.${slot}`]: ""
      });
    }

    await item.update({ "system.equipado": false });

    this.render(true);
  }

  _getItemFromEvent(event) {
    const li = event.currentTarget.closest(".item");
    if (!li) return null;

    const itemId = li.dataset.itemId;
    if (!itemId) return null;

    return this.actor.items.get(itemId) ?? null;
  }

  _formulaCompetenciaPorNivel(nivel) {
    switch (nivel) {
      case 1: return "1d4 + 1";
      case 2: return "1d6 + 2";
      case 3: return "1d8 + 3";
      case 4: return "1d10 + 4";
      case 5: return "1d12 + 5";
      default: return "1d4 + 1";
    }
  }

  _capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  _capitalizarSlot(slot) {
    const labels = {
      cabeza: "Cabeza",
      cuello: "Cuello",
      hombros: "Hombros",
      brazos: "Brazos",
      pecho: "Pecho",
      piernas: "Piernas",
      pies: "Pies",
      manoIzq: "Mano Izquierda",
      manoDer: "Mano Derecha",
      extra: "Extra"
    };

    return labels[slot] || slot;
  }
}