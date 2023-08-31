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

import objectUtils from 'objectUtils';
import mount from 'utils/mount';

import CopyToClipboardAction from './actions/CopyToClipboardAction';
import AlphaNumericFormatViewProvider from './AlphanumericFormatViewProvider.js';
import DisplayLayout from './components/DisplayLayout.vue';
import DisplayLayoutToolbar from './DisplayLayoutToolbar.js';
import DisplayLayoutType from './DisplayLayoutType.js';
import DisplayLayoutDrawingObjectTypes from './DrawingObjectTypes.js';

class DisplayLayoutView {
  constructor(openmct, domainObject, objectPath, options) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this.options = options;

    this.component = null;
    this.app = null;
  }

  show(container, isEditing) {
    const { vNode, destroy } = mount(
      {
        el: container,
        components: {
          DisplayLayout
        },
        provide: {
          openmct: this.openmct,
          objectPath: this.objectPath,
          options: this.options,
          objectUtils,
          currentView: this
        },
        data: () => {
          return {
            domainObject: this.domainObject,
            isEditing
          };
        },
        template:
          '<display-layout ref="displayLayout" :domain-object="domainObject" :is-editing="isEditing"></display-layout>'
      },
      {
        app: this.openmct.app,
        element: container
      }
    );
    this._destroy = destroy;
    this.component = vNode.componentInstance;
  }

  getViewContext() {
    if (!this.component) {
      return {};
    }

    return this.component.$refs.displayLayout.getViewContext();
  }

  getSelectionContext() {
    return {
      item: this.domainObject,
      supportsMultiSelect: true,
      addElement: this.component && this.component.$refs.displayLayout.addElement,
      removeItem: this.component && this.component.$refs.displayLayout.removeItem,
      orderItem: this.component && this.component.$refs.displayLayout.orderItem,
      duplicateItem: this.component && this.component.$refs.displayLayout.duplicateItem,
      switchViewType: this.component && this.component.$refs.displayLayout.switchViewType,
      mergeMultipleTelemetryViews:
        this.component && this.component.$refs.displayLayout.mergeMultipleTelemetryViews,
      mergeMultipleOverlayPlots:
        this.component && this.component.$refs.displayLayout.mergeMultipleOverlayPlots,
      toggleGrid: this.component && this.component.$refs.displayLayout.toggleGrid
    };
  }

  onEditModeChange(isEditing) {
    this.component.isEditing = isEditing;
  }

  destroy() {
    if (this._destroy) {
      this._destroy();
    }
  }
}

export default function DisplayLayoutPlugin(options) {
  return function (openmct) {
    openmct.actions.register(new CopyToClipboardAction(openmct));

    openmct.objectViews.addProvider({
      key: 'layout.view',
      canView: function (domainObject) {
        return domainObject.type === 'layout';
      },
      canEdit: function (domainObject) {
        return domainObject.type === 'layout';
      },
      view: function (domainObject, objectPath) {
        return new DisplayLayoutView(openmct, domainObject, objectPath, options);
      },
      priority() {
        return 100;
      }
    });
    openmct.types.addType('layout', DisplayLayoutType());
    openmct.toolbars.addProvider(new DisplayLayoutToolbar(openmct));
    openmct.inspectorViews.addProvider(new AlphaNumericFormatViewProvider(openmct, options));
    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === 'layout' && child.type === 'folder') {
        return false;
      } else {
        return true;
      }
    });

    for (const [type, definition] of Object.entries(DisplayLayoutDrawingObjectTypes)) {
      openmct.types.addType(type, definition);
    }

    DisplayLayoutPlugin._installed = true;
  };
}
