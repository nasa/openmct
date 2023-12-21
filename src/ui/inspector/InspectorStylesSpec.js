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

import mount from 'utils/mount';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import { mockLocalStorage } from 'utils/testing/mockLocalStorage';

import StylesView from '@/plugins/condition/components/inspector/StylesView.vue';

import SavedStylesView from '../../plugins/inspectorViews/styles/SavedStylesView.vue';
import stylesManager from '../../plugins/inspectorViews/styles/StylesManager';
import {
  mockMultiSelectionMixedStyles,
  mockMultiSelectionNonSpecificStyles,
  mockMultiSelectionSameStyles,
  mockStyle,
  mockTelemetryTableSelection
} from './InspectorStylesSpecMocks';

describe('the inspector', () => {
  let openmct;
  let selection;
  let stylesViewComponent;
  let savedStylesViewComponent;

  mockLocalStorage();

  beforeEach((done) => {
    openmct = createOpenMct();
    spyOn(openmct.objects, 'save').and.returnValue(Promise.resolve(true));
    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('should allow a style to be saved', () => {
    selection = mockTelemetryTableSelection;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(0);

    stylesViewComponent.$refs.root.saveStyle(mockStyle);

    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(1);
  });

  it('should display all saved styles', () => {
    selection = mockTelemetryTableSelection;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(0);
    stylesViewComponent.$refs.root.saveStyle(mockStyle);

    return stylesViewComponent.$nextTick().then(() => {
      expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(1);
    });
  });

  xit('should allow a saved style to be applied', () => {
    spyOn(openmct.editor, 'isEditing').and.returnValue(true);

    selection = mockTelemetryTableSelection;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    stylesViewComponent.$refs.root.saveStyle(mockStyle);

    return stylesViewComponent.$nextTick().then(() => {
      const styleSelectorComponent = savedStylesViewComponent.$refs.root.$refs.root;

      styleSelectorComponent.selectStyle();

      return savedStylesViewComponent.$nextTick().then(() => {
        const styleEditorComponent = stylesViewComponent.$refs.root.$refs.styleEditor;
        const styles = styleEditorComponent.$children.filter(
          (component) => component.options.value === mockStyle.color
        );

        expect(styles.length).toBe(3);
      });
    });
  });

  it('should allow a saved style to be deleted', () => {
    selection = mockTelemetryTableSelection;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    stylesViewComponent.$refs.root.saveStyle(mockStyle);

    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(1);

    savedStylesViewComponent.$refs.root.deleteStyle(0);

    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(0);
  });

  it('should prevent a style from being saved when the number of saved styles is at the limit', () => {
    spyOn(SavedStylesView.methods, 'showLimitReachedDialog').and.callThrough();

    selection = mockTelemetryTableSelection;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    for (let i = 1; i <= 20; i++) {
      stylesViewComponent.$refs.root.saveStyle(mockStyle);
    }

    expect(SavedStylesView.methods.showLimitReachedDialog).not.toHaveBeenCalled();
    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(20);

    stylesViewComponent.$refs.root.saveStyle(mockStyle);

    expect(SavedStylesView.methods.showLimitReachedDialog).toHaveBeenCalled();
    expect(savedStylesViewComponent.$refs.root.savedStyles.length).toBe(20);
  });

  it('should allow styles from multi-selections to be saved', () => {
    spyOn(openmct.editor, 'isEditing').and.returnValue(true);

    selection = mockMultiSelectionSameStyles;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    return stylesViewComponent.$nextTick().then(() => {
      const styleEditorComponent = stylesViewComponent.$refs.root.$refs.styleEditor;
      const saveStyleButton = styleEditorComponent.$refs.saveStyleButton;

      expect(saveStyleButton).not.toBe(undefined);

      saveStyleButton.$refs.button.click();

      expect(savedStylesViewComponent.$refs.root.$data.savedStyles.length).toBe(1);
    });
  });

  it('should prevent mixed styles from being saved', () => {
    spyOn(openmct.editor, 'isEditing').and.returnValue(true);

    selection = mockMultiSelectionMixedStyles;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    return stylesViewComponent.$nextTick().then(() => {
      const styleEditorComponent = stylesViewComponent.$refs.root.$refs.styleEditor;
      const saveStyleButton = styleEditorComponent.$refs.saveStyleButton;

      // Saving should not be enabled, thus the button ref should be undefined
      expect(saveStyleButton).toBe(undefined);
    });
  });

  it('should prevent non-specific styles from being saved', () => {
    spyOn(openmct.editor, 'isEditing').and.returnValue(true);

    selection = mockMultiSelectionNonSpecificStyles;
    stylesViewComponent = createViewComponent(StylesView, selection, openmct);
    savedStylesViewComponent = createViewComponent(SavedStylesView, selection, openmct);

    return stylesViewComponent.$nextTick().then(() => {
      const styleEditorComponent = stylesViewComponent.$refs.root.$refs.styleEditor;
      const saveStyleButton = styleEditorComponent.$refs.saveStyleButton;

      // Saving should not be enabled, thus the button ref should be undefined
      expect(saveStyleButton).toBe(undefined);
    });
  });

  function createViewComponent(component) {
    const element = document.createElement('div');
    const child = document.createElement('div');
    element.appendChild(child);

    const config = {
      provide: {
        openmct,
        selection,
        stylesManager
      },
      components: {},
      template: `<${component.name} ref="root"/>`
    };

    config.components[component.name] = component;

    const { vNode } = mount(config, {
      element
    });
    return vNode.componentInstance;
  }
});
