/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import _ from 'lodash';

const CONTEXT_ACTION = 'contextAction';
const CONTEXT_ACTIONS = Object.freeze({
  ADD_ELEMENT: 'addElement',
  REMOVE_ITEM: 'removeItem',
  DUPLICATE_ITEM: 'duplicateItem',
  ORDER_ITEM: 'orderItem',
  SWITCH_VIEW_TYPE: 'switchViewType',
  MERGE_MULTIPLE_TELEMETRY_VIEWS: 'mergeMultipleTelemetryViews',
  MERGE_MULTIPLE_OVERLAY_PLOTS: 'mergeMultipleOverlayPlots',
  TOGGLE_GRID: 'toggleGrid'
});

const DIALOG_FORM = {
  text: {
    title: 'Text Element Properties',
    sections: [
      {
        rows: [
          {
            key: 'text',
            control: 'textfield',
            name: 'Text',
            required: true,
            cssClass: 'l-input-lg'
          }
        ]
      }
    ]
  },
  image: {
    title: 'Image Properties',
    sections: [
      {
        rows: [
          {
            key: 'url',
            control: 'textfield',
            name: 'Image URL',
            cssClass: 'l-input-lg',
            required: true
          }
        ]
      }
    ]
  }
};
const VIEW_TYPES = {
  'telemetry-view': {
    value: 'telemetry-view',
    name: 'Alphanumeric',
    class: 'icon-alphanumeric'
  },
  'telemetry.plot.overlay': {
    value: 'telemetry.plot.overlay',
    name: 'Overlay Plot',
    class: 'icon-plot-overlay'
  },
  'telemetry.plot.stacked': {
    value: 'telemetry.plot.stacked',
    name: 'Stacked Plot',
    class: 'icon-plot-stacked'
  },
  table: {
    value: 'table',
    name: 'Table',
    class: 'icon-tabular-scrolling'
  }
};
const APPLICABLE_VIEWS = {
  'telemetry-view': [
    VIEW_TYPES['telemetry.plot.overlay'],
    VIEW_TYPES['telemetry.plot.stacked'],
    VIEW_TYPES.table
  ],
  'telemetry.plot.overlay': [
    VIEW_TYPES['telemetry.plot.stacked'],
    VIEW_TYPES.table,
    VIEW_TYPES['telemetry-view']
  ],
  'telemetry.plot.stacked': [
    VIEW_TYPES['telemetry.plot.overlay'],
    VIEW_TYPES.table,
    VIEW_TYPES['telemetry-view']
  ],
  table: [
    VIEW_TYPES['telemetry.plot.overlay'],
    VIEW_TYPES['telemetry.plot.stacked'],
    VIEW_TYPES['telemetry-view']
  ],
  'telemetry-view-multi': [
    VIEW_TYPES['telemetry.plot.overlay'],
    VIEW_TYPES['telemetry.plot.stacked'],
    VIEW_TYPES.table
  ],
  'telemetry.plot.overlay-multi': [VIEW_TYPES['telemetry.plot.stacked']]
};

export default class DisplayLayoutToolbar {
  #openmct;

  constructor(openmct) {
    this.#openmct = openmct;
    this.name = 'Display Layout Toolbar';
    this.key = 'layout';
    this.description = 'A toolbar for objects inside a display layout.';
  }

  forSelection(selection) {
    if (!selection || selection.length === 0) {
      return false;
    }

    let selectionPath = selection[0];
    let selectedObject = selectionPath[0];
    let selectedParent = selectionPath[1];

    // Apply the layout toolbar if the selected object is inside a layout, or the main layout is selected.
    return (
      (selectedParent &&
        selectedParent.context.item &&
        selectedParent.context.item.type === 'layout') ||
      (selectedObject.context.item && selectedObject.context.item.type === 'layout')
    );
  }

  #getPath(selectionPath) {
    return `configuration.items[${selectionPath[0].context.index}]`;
  }

  #getAllOfType(selection, specificType) {
    return selection.filter((selectionPath) => {
      let type = selectionPath[0].context.layoutItem.type;

      return type === specificType;
    });
  }

  #getAllTypes(selection) {
    return selection.filter((selectionPath) => {
      let type = selectionPath[0].context.layoutItem.type;

      return (
        type === 'text-view' ||
        type === 'telemetry-view' ||
        type === 'box-view' ||
        type === 'ellipse-view' ||
        type === 'image-view' ||
        type === 'line-view' ||
        type === 'subobject-view'
      );
    });
  }

  #getAddButton(selection, selectionPath) {
    if (selection.length === 1) {
      selectionPath = selectionPath || selection[0];
      const domainObject = selectionPath[0].context.item;
      const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);

      return {
        control: 'menu',
        domainObject,
        method: (option) => {
          let name = option.name.toLowerCase();
          let form = DIALOG_FORM[name];
          if (form) {
            this.#showForm(form, name, selection);
          } else {
            this.#openmct.objectViews.emit(
              `${CONTEXT_ACTION}:${keyString}`,
              CONTEXT_ACTIONS.ADD_ELEMENT,
              name,
              selection
            );
          }
        },
        key: 'add',
        icon: 'icon-plus',
        label: 'Add Drawing Object',
        options: [
          {
            name: 'Box',
            class: 'icon-box-round-corners'
          },
          {
            name: 'Ellipse',
            class: 'icon-circle'
          },
          {
            name: 'Line',
            class: 'icon-line-horz'
          },
          {
            name: 'Text',
            class: 'icon-font'
          },
          {
            name: 'Image',
            class: 'icon-image'
          }
        ]
      };
    }
  }

  #getToggleFrameButton(selectedParent, selection) {
    return {
      control: 'toggle-button',
      domainObject: selectedParent,
      applicableSelectedItems: selection.filter(
        (selectionPath) => selectionPath[0].context.layoutItem.type === 'subobject-view'
      ),
      property: (selectionPath) => {
        return this.#getPath(selectionPath) + '.hasFrame';
      },
      options: [
        {
          value: false,
          icon: 'icon-frame-hide',
          title: 'Frame visible',
          label: 'Hide frame'
        },
        {
          value: true,
          icon: 'icon-frame-show',
          title: 'Frame hidden',
          label: 'Show frame'
        }
      ]
    };
  }

  #getRemoveButton(selectedParent, selectionPath, selection) {
    const domainObject = selectedParent;
    const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);
    return {
      control: 'button',
      domainObject,
      icon: 'icon-trash',
      title: 'Delete the selected object',
      method: () => {
        let prompt = this.#openmct.overlays.dialog({
          iconClass: 'alert',
          message: `Warning! This action will remove this item from the Display Layout. Do you want to continue?`,
          buttons: [
            {
              label: 'OK',
              emphasis: 'true',
              callback: () => {
                this.#openmct.objectViews.emit(
                  `${CONTEXT_ACTION}:${keyString}`,
                  CONTEXT_ACTIONS.REMOVE_ITEM,
                  this.#getAllTypes(selection),
                  selection
                );
                prompt.dismiss();
              }
            },
            {
              label: 'Cancel',
              callback: function () {
                prompt.dismiss();
              }
            }
          ]
        });
      }
    };
  }

  #getStackOrder(selectedParent, selectionPath, selectedObjects) {
    const domainObject = selectedParent;
    const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);
    return {
      control: 'menu',
      domainObject,
      icon: 'icon-layers',
      title: 'Move the selected object above or below other objects',
      options: [
        {
          name: 'Move to Top',
          value: 'top',
          class: 'icon-arrow-double-up'
        },
        {
          name: 'Move Up',
          value: 'up',
          class: 'icon-arrow-up'
        },
        {
          name: 'Move Down',
          value: 'down',
          class: 'icon-arrow-down'
        },
        {
          name: 'Move to Bottom',
          value: 'bottom',
          class: 'icon-arrow-double-down'
        }
      ],
      method: (option) => {
        this.#openmct.objectViews.emit(
          `${CONTEXT_ACTION}:${keyString}`,
          CONTEXT_ACTIONS.ORDER_ITEM,
          option.value,
          this.#getAllTypes(selectedObjects)
        );
      }
    };
  }

  #getXInput(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'input',
        type: 'number',
        domainObject: selectedParent,
        applicableSelectedItems: this.#getAllTypes(selection),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.x';
        },
        label: 'X:',
        title: 'X position'
      };
    }
  }

  #getYInput(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'input',
        type: 'number',
        domainObject: selectedParent,
        applicableSelectedItems: this.#getAllTypes(selection),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.y';
        },
        label: 'Y:',
        title: 'Y position'
      };
    }
  }

  #getWidthInput(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'input',
        type: 'number',
        domainObject: selectedParent,
        applicableSelectedItems: this.#getAllTypes(selection),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.width';
        },
        label: 'W:',
        title: 'Resize object width'
      };
    }
  }

  #getHeightInput(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'input',
        type: 'number',
        domainObject: selectedParent,
        applicableSelectedItems: this.#getAllTypes(selection),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.height';
        },
        label: 'H:',
        title: 'Resize object height'
      };
    }
  }

  #getX2Input(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'input',
        type: 'number',
        domainObject: selectedParent,
        applicableSelectedItems: selection.filter((selectionPath) => {
          return selectionPath[0].context.layoutItem.type === 'line-view';
        }),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.x2';
        },
        label: 'X2:',
        title: 'X2 position'
      };
    }
  }

  #getY2Input(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'input',
        type: 'number',
        domainObject: selectedParent,
        applicableSelectedItems: selection.filter((selectionPath) => {
          return selectionPath[0].context.layoutItem.type === 'line-view';
        }),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.y2';
        },
        label: 'Y2:',
        title: 'Y2 position'
      };
    }
  }

  #getTextButton(selectedParent, selection) {
    return {
      control: 'button',
      domainObject: selectedParent,
      applicableSelectedItems: selection.filter((selectionPath) => {
        return selectionPath[0].context.layoutItem.type === 'text-view';
      }),
      property: (selectionPath) => {
        return this.#getPath(selectionPath);
      },
      icon: 'icon-pencil',
      title: 'Edit text properties',
      label: 'Edit text',
      dialog: DIALOG_FORM.text
    };
  }

  #getTelemetryValueMenu(selectionPath, selection) {
    if (selection.length === 1) {
      return {
        control: 'select-menu',
        domainObject: selectionPath[1].context.item,
        applicableSelectedItems: selection.filter((path) => {
          return path[0].context.layoutItem.type === 'telemetry-view';
        }),
        property: (path) => {
          return this.#getPath(path) + '.value';
        },
        title: 'Set value',
        options: this.#openmct.telemetry
          .getMetadata(selectionPath[0].context.item)
          .values()
          .map((value) => {
            return {
              name: value.name,
              value: value.key
            };
          })
      };
    }
  }

  #getDisplayModeMenu(selectedParent, selection) {
    if (selection.length === 1) {
      return {
        control: 'select-menu',
        domainObject: selectedParent,
        applicableSelectedItems: selection.filter((selectionPath) => {
          return selectionPath[0].context.layoutItem.type === 'telemetry-view';
        }),
        property: (selectionPath) => {
          return this.#getPath(selectionPath) + '.displayMode';
        },
        title: 'Set display mode',
        options: [
          {
            name: 'Label + Value',
            value: 'all'
          },
          {
            name: 'Label only',
            value: 'label'
          },
          {
            name: 'Value only',
            value: 'value'
          }
        ]
      };
    }
  }

  #getDuplicateButton(selectedParent, selectionPath, selection) {
    const domainObject = selectedParent;
    const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);
    return {
      control: 'button',
      domainObject,
      icon: 'icon-duplicate',
      title: 'Duplicate the selected object',
      method: () => {
        this.#openmct.objectViews.emit(
          `${CONTEXT_ACTION}:${keyString}`,
          CONTEXT_ACTIONS.DUPLICATE_ITEM,
          selection
        );
      }
    };
  }

  #getPropertyFromPath(object, path) {
    let splitPath = path.split('.');
    let property = Object.assign({}, object);

    while (splitPath.length && property) {
      property = property[splitPath.shift()];
    }

    return property;
  }

  #areAllViews(type, path, selection) {
    let allTelemetry = true;

    selection.forEach((selectedItem) => {
      let selectedItemContext = selectedItem[0].context;

      if (this.#getPropertyFromPath(selectedItemContext, path) !== type) {
        allTelemetry = false;
      }
    });

    return allTelemetry;
  }

  #getToggleUnitsButton(selectedParent, selection) {
    let applicableItems = this.#getAllOfType(selection, 'telemetry-view');
    applicableItems = this.#unitsOnly(applicableItems);
    if (!applicableItems.length) {
      return;
    }

    return {
      control: 'toggle-button',
      domainObject: selectedParent,
      applicableSelectedItems: applicableItems,
      property: (selectionPath) => {
        return this.#getPath(selectionPath) + '.showUnits';
      },
      options: [
        {
          value: true,
          icon: 'icon-eye-open',
          title: 'Show units',
          label: 'Show units'
        },
        {
          value: false,
          icon: 'icon-eye-disabled',
          title: 'Hide units',
          label: 'Hide units'
        }
      ]
    };
  }

  #unitsOnly(items) {
    let results = items.filter((item) => {
      let currentItem = item[0];
      let metadata = this.#openmct.telemetry.getMetadata(currentItem.context.item);
      if (!metadata) {
        return false;
      }

      let hasUnits = metadata.valueMetadatas.filter((metadatum) => metadatum.unit).length;

      return hasUnits > 0;
    });

    return results;
  }

  #getViewSwitcherMenu(selectedParent, selectionPath, selection) {
    if (selection.length === 1) {
      let selectedItemContext = selectionPath[0].context;
      let selectedItemType = selectedItemContext.item.type;

      if (selectedItemContext.layoutItem.type === 'telemetry-view') {
        selectedItemType = 'telemetry-view';
      }

      let viewOptions = APPLICABLE_VIEWS[selectedItemType];

      if (viewOptions) {
        const domainObject = selectedParent;
        const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);
        return {
          control: 'menu',
          domainObject,
          icon: 'icon-object',
          title: 'Switch the way this telemetry is displayed',
          label: 'View type',
          options: viewOptions,
          method: (option) => {
            this.#openmct.objectViews.emit(
              `${CONTEXT_ACTION}:${keyString}`,
              CONTEXT_ACTIONS.SWITCH_VIEW_TYPE,
              selectedItemContext,
              option.value,
              selection
            );
          }
        };
      }
    } else if (selection.length > 1) {
      const domainObject = selectedParent;
      const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);
      if (this.#areAllViews('telemetry-view', 'layoutItem.type', selection)) {
        return {
          control: 'menu',
          domainObject,
          icon: 'icon-object',
          title: 'Merge into a telemetry table or plot',
          label: 'View type',
          options: APPLICABLE_VIEWS['telemetry-view-multi'],
          method: (option) => {
            this.#openmct.objectViews.emit(
              `${CONTEXT_ACTION}:${keyString}`,
              CONTEXT_ACTIONS.MERGE_MULTIPLE_TELEMETRY_VIEWS,
              selection,
              option.value
            );
          }
        };
      } else if (this.#areAllViews('telemetry.plot.overlay', 'item.type', selection)) {
        return {
          control: 'menu',
          domainObject,
          icon: 'icon-object',
          title: 'Merge into a stacked plot',
          options: APPLICABLE_VIEWS['telemetry.plot.overlay-multi'],
          method: (option) => {
            this.#openmct.objectViews.emit(
              `${CONTEXT_ACTION}:${keyString}`,
              CONTEXT_ACTIONS.MERGE_MULTIPLE_OVERLAY_PLOTS,
              selection,
              option.value
            );
          }
        };
      }
    }
  }

  #getToggleGridButton(selection, selectionPath) {
    const ICON_GRID_SHOW = 'icon-grid-on';
    const ICON_GRID_HIDE = 'icon-grid-off';

    let displayLayoutContext;

    if (selection.length === 1 && selectionPath === undefined) {
      displayLayoutContext = selection[0][0].context;
    } else {
      displayLayoutContext = selectionPath[1].context;
    }

    const domainObject = displayLayoutContext.item;
    const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);

    return {
      control: 'button',
      domainObject,
      icon: ICON_GRID_SHOW,
      method: () => {
        this.#openmct.objectViews.emit(
          `${CONTEXT_ACTION}:${keyString}`,
          CONTEXT_ACTIONS.TOGGLE_GRID
        );

        this.icon = this.icon === ICON_GRID_SHOW ? ICON_GRID_HIDE : ICON_GRID_SHOW;
      },
      secondary: true
    };
  }

  #getSeparator() {
    return {
      control: 'separator'
    };
  }

  #isMainLayoutSelected(selectionPath) {
    let selectedObject = selectionPath[0].context.item;

    return (
      selectedObject && selectedObject.type === 'layout' && !selectionPath[0].context.layoutItem
    );
  }

  #showForm(formStructure, name, selection) {
    const domainObject = selection[0][0].context.item;
    const keyString = this.#openmct.objects.makeKeyString(domainObject.identifier);
    this.#openmct.forms.showForm(formStructure).then((changes) => {
      this.#openmct.objectViews.emit(
        `${CONTEXT_ACTION}:${keyString}`,
        CONTEXT_ACTIONS.ADD_ELEMENT,
        name,
        changes,
        selection
      );
    });
  }

  toolbar(selectedObjects) {
    if (this.#isMainLayoutSelected(selectedObjects[0])) {
      return [this.#getToggleGridButton(selectedObjects), this.#getAddButton(selectedObjects)];
    }

    let toolbar = {
      'add-menu': [],
      text: [],
      url: [],
      viewSwitcher: [],
      'toggle-frame': [],
      'display-mode': [],
      'telemetry-value': [],
      style: [],
      'unit-toggle': [],
      position: [],
      duplicate: [],
      remove: [],
      'toggle-grid': []
    };

    selectedObjects.forEach((selectionPath) => {
      let selectedParent = selectionPath[1].context.item;
      let layoutItem = selectionPath[0].context.layoutItem;

      if (!layoutItem || selectedParent.locked) {
        return;
      }

      if (layoutItem.type === 'subobject-view') {
        if (toolbar['add-menu'].length === 0 && selectionPath[0].context.item.type === 'layout') {
          toolbar['add-menu'] = [this.#getAddButton(selectedObjects, selectionPath)];
        }

        if (toolbar['toggle-frame'].length === 0) {
          toolbar['toggle-frame'] = [this.#getToggleFrameButton(selectedParent, selectedObjects)];
        }

        if (toolbar.position.length === 0) {
          toolbar.position = [
            this.#getStackOrder(selectedParent, selectionPath, selectedObjects),
            this.#getSeparator(),
            this.#getXInput(selectedParent, selectedObjects),
            this.#getYInput(selectedParent, selectedObjects),
            this.#getHeightInput(selectedParent, selectedObjects),
            this.#getWidthInput(selectedParent, selectedObjects)
          ];
        }

        if (toolbar.remove.length === 0) {
          toolbar.remove = [this.#getRemoveButton(selectedParent, selectionPath, selectedObjects)];
        }

        if (toolbar.viewSwitcher.length === 0) {
          toolbar.viewSwitcher = [
            this.#getViewSwitcherMenu(selectedParent, selectionPath, selectedObjects)
          ];
        }
      } else if (layoutItem.type === 'telemetry-view') {
        if (toolbar['display-mode'].length === 0) {
          toolbar['display-mode'] = [this.#getDisplayModeMenu(selectedParent, selectedObjects)];
        }

        if (toolbar['telemetry-value'].length === 0) {
          toolbar['telemetry-value'] = [
            this.#getTelemetryValueMenu(selectionPath, selectedObjects)
          ];
        }

        if (toolbar['unit-toggle'].length === 0) {
          let toggleUnitsButton = this.#getToggleUnitsButton(selectedParent, selectedObjects);
          if (toggleUnitsButton) {
            toolbar['unit-toggle'] = [toggleUnitsButton];
          }
        }

        if (toolbar.position.length === 0) {
          toolbar.position = [
            this.#getStackOrder(selectedParent, selectionPath, selectedObjects),
            this.#getSeparator(),
            this.#getXInput(selectedParent, selectedObjects),
            this.#getYInput(selectedParent, selectedObjects),
            this.#getHeightInput(selectedParent, selectedObjects),
            this.#getWidthInput(selectedParent, selectedObjects)
          ];
        }

        if (toolbar.remove.length === 0) {
          toolbar.remove = [this.#getRemoveButton(selectedParent, selectionPath, selectedObjects)];
        }

        if (toolbar.viewSwitcher.length === 0) {
          toolbar.viewSwitcher = [
            this.#getViewSwitcherMenu(selectedParent, selectionPath, selectedObjects)
          ];
        }
      } else if (layoutItem.type === 'text-view') {
        if (toolbar.position.length === 0) {
          toolbar.position = [
            this.#getStackOrder(selectedParent, selectionPath, selectedObjects),
            this.#getSeparator(),
            this.#getXInput(selectedParent, selectedObjects),
            this.#getYInput(selectedParent, selectedObjects),
            this.#getHeightInput(selectedParent, selectedObjects),
            this.#getWidthInput(selectedParent, selectedObjects)
          ];
        }

        if (toolbar.text.length === 0) {
          toolbar.text = [this.#getTextButton(selectedParent, selectedObjects)];
        }

        if (toolbar.remove.length === 0) {
          toolbar.remove = [this.#getRemoveButton(selectedParent, selectionPath, selectedObjects)];
        }
      } else if (layoutItem.type === 'box-view' || layoutItem.type === 'ellipse-view') {
        if (toolbar.position.length === 0) {
          toolbar.position = [
            this.#getStackOrder(selectedParent, selectionPath, selectedObjects),
            this.#getSeparator(),
            this.#getXInput(selectedParent, selectedObjects),
            this.#getYInput(selectedParent, selectedObjects),
            this.#getHeightInput(selectedParent, selectedObjects),
            this.#getWidthInput(selectedParent, selectedObjects)
          ];
        }

        if (toolbar.remove.length === 0) {
          toolbar.remove = [this.#getRemoveButton(selectedParent, selectionPath, selectedObjects)];
        }
      } else if (layoutItem.type === 'image-view') {
        if (toolbar.position.length === 0) {
          toolbar.position = [
            this.#getStackOrder(selectedParent, selectionPath, selectedObjects),
            this.#getSeparator(),
            this.#getXInput(selectedParent, selectedObjects),
            this.#getYInput(selectedParent, selectedObjects),
            this.#getHeightInput(selectedParent, selectedObjects),
            this.#getWidthInput(selectedParent, selectedObjects)
          ];
        }

        if (toolbar.remove.length === 0) {
          toolbar.remove = [this.#getRemoveButton(selectedParent, selectionPath, selectedObjects)];
        }
      } else if (layoutItem.type === 'line-view') {
        if (toolbar.position.length === 0) {
          toolbar.position = [
            this.#getStackOrder(selectedParent, selectionPath),
            this.#getSeparator(),
            this.#getXInput(selectedParent, selectedObjects),
            this.#getYInput(selectedParent, selectedObjects),
            this.#getX2Input(selectedParent, selectedObjects),
            this.#getY2Input(selectedParent, selectedObjects)
          ];
        }

        if (toolbar.remove.length === 0) {
          toolbar.remove = [this.#getRemoveButton(selectedParent, selectionPath, selectedObjects)];
        }
      }

      if (toolbar.duplicate.length === 0) {
        toolbar.duplicate = [
          this.#getDuplicateButton(selectedParent, selectionPath, selectedObjects)
        ];
      }

      if (toolbar['toggle-grid'].length === 0) {
        toolbar['toggle-grid'] = [this.#getToggleGridButton(selectedObjects, selectionPath)];
      }
    });

    let toolbarArray = Object.values(toolbar);

    return _.flatten(
      toolbarArray.reduce((accumulator, group, index) => {
        group = group.filter((control) => control !== undefined);

        if (group.length > 0) {
          accumulator.push(group);

          if (index < toolbarArray.length - 1) {
            accumulator.push(this.#getSeparator());
          }
        }

        return accumulator;
      }, [])
    );
  }
}
