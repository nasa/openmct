/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
} from '../../utils/testing';
import { FAULT_MANAGEMENT_TYPE } from './constants';

describe("The Fault Management Plugin", () => {
    let openmct;

    beforeEach(() => {
        openmct = createOpenMct();
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('is not installed by default', () => {
        let typeDef = openmct.types.get(FAULT_MANAGEMENT_TYPE).definition;

        expect(typeDef.name).toBe('Unknown Type');
    });

    it('can be installed', () => {
        openmct.install(openmct.plugins.FaultManagement());
        let typeDef = openmct.types.get(FAULT_MANAGEMENT_TYPE).definition;

        expect(typeDef.name).toBe('Fault Management');
    });
});
