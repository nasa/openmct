/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import { EventEmitter } from 'eventemitter3';
import _ from 'lodash';

/**
 * Manages the styling of selected elements.
 */
class SelectionStyler {
  /**
   * Adds selection style to the given selectable.
   * @param {Object} selectable - The selectable object.
   */
  static addSelectionStyle(selectable) {
    if (selectable[0] && selectable[0].element) {
      selectable[0].element.setAttribute('s-selected', '');
    }
    if (selectable[1] && selectable[1].element) {
      selectable[1].element.setAttribute('s-selected-parent', '');
    }
  }

  /**
   * Removes selection style from the given selectable.
   * @param {Object} selectionPath - The selection path object.
   * @param {boolean} keepParentStyle - Whether to keep the parent style.
   */
  static removeSelectionStyle(selectionPath, keepParentStyle = false) {
    if (selectionPath[0] && selectionPath[0].element) {
      selectionPath[0].element.removeAttribute('s-selected');
    }
    if (selectionPath[1] && selectionPath[1].element && !keepParentStyle) {
      selectionPath[1].element.removeAttribute('s-selected-parent');
    }
  }
}

/**
 * Manages the selection state.
 */
class SelectionManager extends EventEmitter {
  /**
   * @param {Object} openmct - The Open MCT API object.
   */
  constructor(openmct) {
    super();

    /** @type {OpenMCT} */
    this.openmct = openmct;
    /** @type {Selectable[]} */
    this.selected = [];
  }

  /**
   * Gets the selected object.
   * @returns {Selectable[]} The currently selected objects
   * @public
   */
  get() {
    return this.selected;
  }

  /**
   * Selects the given selectable object(s).
   * @param {Object|Array} selectable - The selectable object(s) to select.
   * @param {boolean} isMultiSelectEvent - Whether this is a multi-select event.
   */
  select(selectable, isMultiSelectEvent) {
    if (!Array.isArray(selectable)) {
      selectable = [selectable];
    }

    if (isMultiSelectEvent && this.canMultiSelect(selectable)) {
      this.handleMultiSelect(selectable);
    } else {
      this.handleSingleSelect(selectable);
    }
  }

  /**
   * Checks if multi-select is possible for the given selectable.
   * @param {Object} selectable - The selectable object to check.
   * @returns {boolean} Whether multi-select is possible.
   */
  canMultiSelect(selectable) {
    return (
      this.parentSupportsMultiSelect(selectable) &&
      this.isPeer(selectable) &&
      !this.selectionContainsParent(selectable)
    );
  }

  /**
   * Handles multi-select logic.
   * @param {Object} selectable - The selectable object.
   */
  handleMultiSelect(selectable) {
    if (this.elementSelected(selectable)) {
      this.remove(selectable);
    } else {
      this.addSelection(selectable);
    }
    this.emit('change', this.selected);
  }

  /**
   * Handles single-select logic.
   * @param {Object} selectable - The selectable object.
   */
  handleSingleSelect(selectable) {
    if (!_.isEqual([selectable], this.selected)) {
      this.clearSelection();
      this.addSelection(selectable);
      this.emit('change', this.selected);
    }
  }

  /**
   * Adds a selectable to the selection.
   * @param {Object} selectable - The selectable object to add.
   */
  addSelection(selectable) {
    this.selected.push(selectable);
    SelectionStyler.addSelectionStyle(selectable);
  }

  /**
   * Clears the current selection.
   */
  clearSelection() {
    this.selected.forEach(SelectionStyler.removeSelectionStyle);
    this.selected = [];
  }

  /**
   * Removes a selectable from the selection.
   * @param {Object} selectable - The selectable object to remove.
   */
  remove(selectable) {
    this.selected = this.selected.filter(
      (selectionPath) => !_.isEqual(selectionPath, selectable)
    );
    if (this.selected.length === 0) {
      SelectionStyler.removeSelectionStyle(selectable);
      selectable[1].element.click(); // Select the parent if there is no selection.
    } else {
      SelectionStyler.removeSelectionStyle(selectable, true);
    }
  }

  /**
   * Checks if the given selectable is currently selected.
   * @param {Object} selectable - The selectable object to check.
   * @returns {boolean} Whether the selectable is currently selected.
   */
  elementSelected(selectable) {
    return this.selected.some((selectionPath) => _.isEqual(selectionPath, selectable));
  }

  /**
   * Checks if the parent of the given selectable supports multi-select.
   * @param {Object} selectable - The selectable object to check.
   * @returns {boolean} Whether the parent supports multi-select.
   */
  parentSupportsMultiSelect(selectable) {
    return selectable[1] && selectable[1].context.supportsMultiSelect;
  }

  /**
   * Checks if the given selectable is a peer of the current selection.
   * @param {Object} selectable - The selectable object to check.
   * @returns {boolean} Whether the selectable is a peer.
   */
  isPeer(selectable) {
    return this.selected.some((selectionPath) => _.isEqual(selectionPath[1], selectable[1]));
  }

  /**
   * Checks if the current selection contains the parent of the given selectable.
   * @param {Object} selectable - The selectable object to check.
   * @returns {boolean} Whether the selection contains the parent.
   */
  selectionContainsParent(selectable) {
    return this.selected.some((selectionPath) => _.isEqual(selectionPath[0], selectable[1]));
  }
}

/**
 * Manages the attachment of selection behavior to elements.
 */
class SelectableAttacher {
  /**
   * @param {Object} openmct - The Open MCT API object.
   * @param {SelectionManager} selectionManager - The selection manager instance.
   */
  constructor(openmct, selectionManager) {
    this.openmct = openmct;
    this.selectionManager = selectionManager;
    this.capturing = null;
  }

  /**
   * Attaches selection behavior to an element.
   * @param {HTMLElement} element - The element to attach to.
   * @param {Object} context - The context object.
   * @param {boolean|Object} select - Whether to select the element immediately.
   * @returns {Function} A function to remove the attached behavior.
   */
  attach(element, context, select) {
    if (!this.isSelectable(element)) {
      return () => {};
    }

    const selectable = { context, element };
    const capture = this.capture.bind(this, selectable);
    const selectCapture = this.selectCapture.bind(this, selectable);
    let removeMutable = false;

    element.addEventListener('click', capture, true);
    element.addEventListener('click', selectCapture);

    if (context.item && context.item.isMutable !== true) {
      removeMutable = true;
      context.item = this.openmct.objects.toMutable(context.item);
    }

    if (select) {
      if (typeof select === 'object') {
        element.dispatchEvent(select);
      } else if (typeof select === 'boolean') {
        element.click();
      }
    }

    return () => {
      element.removeEventListener('click', capture, true);
      element.removeEventListener('click', selectCapture);

      if (context.item !== undefined && context.item.isMutable && removeMutable === true) {
        this.openmct.objects.destroyMutable(context.item);
      }
    };
  }

  /**
   * Checks if an element is selectable.
   * @param {HTMLElement} element - The element to check.
   * @returns {boolean} Whether the element is selectable.
   */
  isSelectable(element) {
    return element && Boolean(element.closest('[data-selectable]'));
  }

  /**
   * Captures a selection event.
   * @param {Object} selectable - The selectable object.
   * @param {Event} event - The triggering event.
   */
  capture(selectable, event) {
    event.stopPropagation();
    
    const capturingContainsSelectable = this.capturing && this.capturing.includes(selectable);

    if (!this.capturing || capturingContainsSelectable) {
      this.capturing = [];
    }

    this.capturing.push(selectable);
  }

  /**
   * Processes a captured selection event.
   * @param {Object} selectable - The selectable object.
   * @param {Event} event - The triggering event.
   */
  selectCapture(selectable, event) {
    event.stopPropagation();
    
    if (!this.capturing) {
      return;
    }

    const reversedCapturing = this.capturing.reverse();
    this.capturing = null;
    
    this.selectionManager.select(reversedCapturing, event.shiftKey);
  }
}

/**
 * Main Selection class that serves as a facade for selection functionality.
 */
export default class Selection {
  /**
   * @param {Object} openmct - The Open MCT API object.
   */
  constructor(openmct) {
    this.selectionManager = new SelectionManager(openmct);
    this.selectableAttacher = new SelectableAttacher(openmct, this.selectionManager);
  }

  /**
   * Gets the current selection.
   * @returns {Array} The currently selected objects.
   */
  get() {
    return this.selectionManager.get();
  }

  /**
   * Selects the given selectable object(s).
   * @param {Object|Array} selectable - The selectable object(s) to select.
   * @param {boolean} isMultiSelectEvent - Whether this is a multi-select event.
   */
  select(selectable, isMultiSelectEvent) {
    this.selectionManager.select(selectable, isMultiSelectEvent);
  }

  /**
   * Makes an element selectable.
   * @param {HTMLElement} element - The element to make selectable.
   * @param {Object} context - The context object.
   * @param {boolean|Object} select - Whether to select the element immediately.
   * @returns {Function} A function to remove the selectable behavior.
   */
  selectable(element, context, select) {
    return this.selectableAttacher.attach(element, context, select);
  }

  /**
   * Adds an event listener.
   * @param {string} eventName - The name of the event.
   * @param {Function} callback - The callback function.
   */
  on(eventName, callback) {
    this.selectionManager.on(eventName, callback);
  }

  /**
   * Removes an event listener.
   * @param {string} eventName - The name of the event.
   * @param {Function} callback - The callback function to remove.
   */
  off(eventName, callback) {
    this.selectionManager.off(eventName, callback);
  }
}