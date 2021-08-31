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

export default class PauseTimerAction {
    constructor(openmct) {
        this.name = 'Pause';
        this.key = 'timer.pause';
        this.description = 'Pause the currently displayed timer';
        this.group = 'action';
        this.cssClass = 'icon-pause';
        this.priority = 1;

        this.openmct = openmct;
    }
    invoke(objectPath) {
        const domainObject = objectPath[0];

        this.openmct.objects.mutate(domainObject, 'configuration.timerState', 'paused');
        this.openmct.objects.mutate(domainObject, 'configuration.pausedTime', new Date());
    }
    appliesTo(objectPath) {
        const domainObject = objectPath[0];
        if (!domainObject || !domainObject.configuration) {
            return;
        }

        const { timerState } = domainObject.configuration;

        return domainObject.type === 'timer' && timerState === 'started';
    }
}
