/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

import { createOpenMct, resetApplicationState } from "utils/testing";
import HyperLinkPlugin from "./plugin";

fdescribe("The controller for hyperlinks", function () {
    let mockDomainObject;
    let mockObjectPath;
    let openmct;
    let element;
    let child;
    let hyperLinkView;

    beforeEach((done) => {
        mockObjectPath = [
            {
                name: 'mock folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            },
            {
                name: 'mock parent folder',
                type: 'hyper-link',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];

        mockDomainObject = {
            displayFormat: "",
            openNewTab: "",
            name: "Unnamed HyperLink Henry",
            type: "hyper-link",
            location: "f69c21ac-24ef-450c-8e2f-3d527087d285",
            modified: 1627483839783,
            url: "123",
            displayText: "123",
            persisted: 1627483839783,
            id: "3d9c243d-dffb-446b-8474-d9931a99d679",
            identifier: {
                namespace: "",
                key: "3d9c243d-dffb-446b-8474-d9931a99d679"
            }
        };

        openmct = createOpenMct();
        openmct.install(new HyperLinkPlugin());

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.on('start', done);
        openmct.startHeadless();

    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("knows when it should open a new tab", function () {
        // create hyperlink instance with mock domain obj
        mockDomainObject.displayFormat = "link";
        mockDomainObject.openNewTab = "newTab";

        const applicableViews = openmct.objectViews.get(mockDomainObject, mockObjectPath);
        hyperLinkView = applicableViews.find((viewProvider) => viewProvider.key === 'hyper-link.view');
        let view = hyperLinkView.view(mockDomainObject, element);
        // view.show(child, true);
        console.log(view.options);
        // expect(controller.openNewTab())
        //     .toBe(true);
    });
    xit("knows when it is a button", function () {
        scope.domainObject.getModel.and.returnValue({
            "displayFormat": "button",
            "openNewTab": "thisTab",
            "showTitle": false
        }
        );
        controller = new HyperlinkController(scope);
        expect(controller.isButton())
            .toEqual(true);
    });
    xit("knows when it should open in the same tab", function () {
        scope.domainObject.getModel.and.returnValue({
            "displayFormat": "link",
            "openNewTab": "thisTab",
            "showTitle": false
        }
        );
        controller = new HyperlinkController(scope);
        expect(controller.openNewTab())
            .toBe(false);
    });
    xit("knows when it is a link", function () {
        scope.domainObject.getModel.and.returnValue({
            "displayFormat": "link",
            "openNewTab": "thisTab",
            "showTitle": false
        }
        );
        controller = new HyperlinkController(scope);
        expect(controller.openNewTab())
            .toBe(false);
    });
});
