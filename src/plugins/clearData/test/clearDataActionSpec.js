/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

import ClearDataAction from '../clearDataAction.js';

fdescribe('Clear Data Action', function () {
    var mockObjectViews = jasmine.createSpyObj('objectViews', ['emit']),
        openmct = {objectViews: mockObjectViews},
        mockObjectPath = [
            {name: 'mockObject1'},
            {name: 'mockObject2'}
        ],
        action;

    beforeEach(function () {
        action = new ClearDataAction(openmct);
    });

    it('emits a clearData event when invoked', function () {
        action.invoke(mockObjectPath);

        expect(mockObjectViews.emit).toHaveBeenCalledWith('clearData', mockObjectPath[0]);
    });
});
