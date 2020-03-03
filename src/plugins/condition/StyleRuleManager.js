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

import * as EventEmitter from 'eventemitter3';

export default class StyleRuleManager extends EventEmitter {
    constructor(domainObject, openmct) {
        super();
        this.domainObject = domainObject;
        this.openmct = openmct;
        if (this.domainObject.configuration && this.domainObject.configuration.conditionalStyle) {
            this.conditionSetIdentfier = this.domainObject.configuration.conditionalStyle.conditionSetIdentifier;
            this.defaultStyle = this.domainObject.configuration.conditionalStyle.defaultStyle;
            this.conditionalStyles = this.domainObject.configuration.conditionalStyle.styles || [];
            this.initialize();
        }
    }

    initialize() {
        this.openmct.objects.get(this.conditionSetIdentfier).then((obj) => {
            this.stopProvidingTelemetry = this.openmct.telemetry.subscribe(obj, output => this.handleConditionSetResultUpdated(output));
        });
    }

    findStyleByConditionId(id) {
        for(let i=0, ii=this.conditionalStyles.length; i < ii; i++) {
            if (this.openmct.objects.makeKeyString(this.conditionalStyles[i].conditionIdentifier) === this.openmct.objects.makeKeyString(id)) {
                return this.conditionalStyles[i];
            }
        }
    }

    handleConditionSetResultUpdated(resultData) {
        let identifier = this.openmct.objects.makeKeyString(resultData.conditionId);
        let found = this.findStyleByConditionId(identifier);
        if (found) {
            if (found.style !== this.currentStyle) {
                this.currentStyle = found.style;
            }
        } else {
            if (this.currentStyle !== this.defaultStyle) {
                this.currentStyle = this.defaultStyle;
            }
        }
    }

    updateDomainObjectStyle() {
        this.emit('conditionalStyleUpdated', this.currentStyle)
    }

    destroy() {
        this.updateDomainObjectStyle(this.defaultStyle);
        if (this.stopProvidingTelemetry) {
            this.stopProvidingTelemetry();
        }
    }

}
