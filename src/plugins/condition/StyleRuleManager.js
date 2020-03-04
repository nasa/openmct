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

import EventEmitter from 'EventEmitter';

export default class StyleRuleManager extends EventEmitter {
    constructor(conditionalStyleConfiguration, openmct) {
        super();
        this.openmct = openmct;
        if (conditionalStyleConfiguration && conditionalStyleConfiguration.conditionSetIdentifier) {
            this.initialize(conditionalStyleConfiguration);
            this.subscribeToConditionSet();
        }
    }

    initialize(conditionalStyleConfiguration) {
        this.conditionSetIdentifier = conditionalStyleConfiguration.conditionSetIdentifier;
        this.defaultStyle = conditionalStyleConfiguration.defaultStyle;
        this.updateConditionStylesMap(conditionalStyleConfiguration.styles || []);
    }

    subscribeToConditionSet() {
        if (this.stopProvidingTelemetry) {
            this.stopProvidingTelemetry();
        }
        this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
            this.stopProvidingTelemetry = this.openmct.telemetry.subscribe(conditionSetDomainObject, output => this.handleConditionSetResultUpdated(output));
        });
    }

    updateConditionalStyleConfig(conditionalStyleConfiguration) {
        if (!conditionalStyleConfiguration || !conditionalStyleConfiguration.conditionSetIdentifier) {
            this.destroy();
        } else {
            let isNewConditionSet = !this.conditionSetIdentifier ||
                                    (this.openmct.objects.makeKeyString(this.conditionSetIdentifier) !== this.openmct.objects.makeKeyString(conditionalStyleConfiguration.conditionSetIdentifier));
            this.initialize(conditionalStyleConfiguration);
            //Only resubscribe if the conditionSet has changed.
            if (isNewConditionSet) {
                this.subscribeToConditionSet();
            }
        }
    }

    updateConditionStylesMap(conditionStyles) {
        let conditionStyleMap = {};
        conditionStyles.forEach((conditionStyle) => {
            const identifier = this.openmct.objects.makeKeyString(conditionStyle.conditionIdentifier);
            conditionStyleMap[identifier] = conditionStyle.style;
        });
        this.conditionalStyleMap = conditionStyleMap;
    }

    handleConditionSetResultUpdated(resultData) {
        let identifier = this.openmct.objects.makeKeyString(resultData.conditionId);
        let foundStyle = this.conditionalStyleMap[identifier];
        if (foundStyle) {
            if (foundStyle !== this.currentStyle) {
                this.currentStyle = foundStyle;
            }
        } else {
            if (this.currentStyle !== this.defaultStyle) {
                this.currentStyle = this.defaultStyle;
            }
        }

        this.updateDomainObjectStyle();
    }

    updateDomainObjectStyle() {
        this.emit('conditionalStyleUpdated', this.currentStyle)
    }

    destroy() {
        this.currentStyle = this.defaultStyle;
        this.updateDomainObjectStyle();
        if (this.stopProvidingTelemetry) {
            this.stopProvidingTelemetry();
        }
        this.conditionSetIdentifier = undefined;
    }

}
