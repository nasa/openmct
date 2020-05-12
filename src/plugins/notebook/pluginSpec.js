/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import NotebookPlugin  from './plugin.js';
import {createOpenMct} from "@/testTools";

describe('When the Notebook Snapshot Plugin is installed,', function () {
    let openmct = createOpenMct();

    const appHolder = document.createElement('div');
    appHolder.style.width = '640px';
    appHolder.style.height = '480px';

    let element = document.createElement('div');
    let child = document.createElement('div');
    element.appendChild(child);

    openmct.install(NotebookPlugin());

    let notebookDefinition = openmct.types.get('notebook').definition;

    let mockNotebookObject = {
        identifier: {
            key: 'testNotebookKey',
            namespace: ''
        },
        type: 'notebook'
    };

    notebookDefinition.initialize(mockNotebookObject);

    it('defines a notebook object type with the correct key', () => {
        expect(notebookDefinition.key).toEqual(mockNotebookObject.key);
    });

    it('Global Notebook Indicator is installed', function () {
        expect(openmct.indicators.indicatorObjects.length).toEqual(1);
    });
});
