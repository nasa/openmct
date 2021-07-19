/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';

describe("the pane", () => {
    let openmct;
    let appHolder;
    let element;
    let child;
    let resolveFunction;

    beforeEach((done) => {
        openmct = createOpenMct();

        appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();
        openmct.install(openmct.plugins.MyItems());
        openmct.install(openmct.plugins.LocalTimeSystem());
        openmct.install(openmct.plugins.UTCTimeSystem());

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        openmct.on('start', done);
        openmct.start(appHolder);

        document.body.append(appHolder);

    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });
    it('toggling tree will toggle tree hide params', (done) => {
        document.querySelector('.l-shell__pane-tree .l-pane__collapse-button').click();
        expect(openmct.router.getSearchParam('hideTree')).toBe('true');
        done();
    });

    it('tree pane collapses when adding hide tree param in URL', () => {
        openmct.router.setSearchParam('hideTree', 'true');
        expect(document.querySelector('.l-shell__pane-tree.l-pane--collapsed')).toBeDefined();
    });

    it('inspector pane collapses when adding hide inspector param in URL', () => {
        openmct.router.setSearchParam('hideInspector', 'true');
        expect(document.querySelector('.l-shell__pane-inspector.l-pane--collapsed')).toBeDefined();
    });

    it('toggle inspector pane will toggle inspector hide param', (done) => {
        // There's a short delay on addubg the param.
        resolveFunction = () => {
            setTimeout(() => {
                expect(openmct.router.getSearchParam('hideInspector')).toBe('true');
                done();
            }, 500);
        };

        openmct.router.on('change:params', resolveFunction);
        document.querySelector('.l-shell__pane-inspector .l-pane__collapse-button').click();
    });

});
