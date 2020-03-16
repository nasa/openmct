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

import ConditionManager from './ConditionManager'

export default class ConditionSetTelemetryProvider {
    constructor(openmct) {
        this.openmct = openmct;
    }

    isTelemetryObject(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    supportsRequest(domainObject, options) {
        return false;
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === 'conditionSet';
    }

    subscribe(domainObject, callback) {
        let conditionManager = new ConditionManager(domainObject, this.openmct);
        conditionManager.on('conditionSetResultUpdated', callback);

        let stopObservingForChanges = this.openmct.objects.observe(domainObject, '*', (newDomainObject) => {
            conditionManager.update(newDomainObject);
        });

        return function unsubscribe() {
            conditionManager.off('conditionSetResultUpdated');
            conditionManager.destroy();
            if (stopObservingForChanges) {
                stopObservingForChanges();
            }
        }
    }
}
