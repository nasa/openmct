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

<template>
<component
    :is="urlDefined ? 'a' : 'span'"
    class="c-condition-widget u-style-receiver js-style-receiver"
    :href="url"
>
    <div class="c-condition-widget__label">
        {{ label }}
    </div>
</component>
</template>

<script>
const sanitizeUrl = require("@braintree/sanitize-url").sanitizeUrl;

export default {
    inject: ['openmct', 'domainObject'],
    data: function () {
        return {
            internalDomainObject: this.domainObject,
            conditionalLabel: ''
        };
    },
    computed: {
        label() {
            return this.conditionalLabel.length
                ? this.conditionalLabel
                : this.internalDomainObject.label;
        },
        urlDefined() {
            return this.internalDomainObject.url && this.internalDomainObject.url.length > 0;
        },
        url() {
            return this.urlDefined ? sanitizeUrl(this.internalDomainObject.url) : null;
        }
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', this.updateInternalDomainObject);

        this.unobserve = this.openmct.styleManager.observe(this.internalDomainObject.identifier, this.observeStyleManagerChanges.bind(this));
    },
    beforeDestroy() {
        if (this.unlisten) {
            this.unlisten();
        }

        if (this.unobserve) {
            this.openmct.styleManager.delete(this.internalDomainObject.identifier);
            this.unobserve();
        }
    },
    methods: {
        observeStyleManagerChanges(styleManager) {
            if (styleManager) {
                this.styleManager = styleManager;
                this.styleManager.on('updateStyles', this.updateConditionLabel);
            } else {
                this.styleManager.off('updateStyles', this.updateConditionLabel);
            }
        },
        updateConditionLabel(styleObj = {}) {
            this.conditionalLabel = styleObj.output || '';
        },
        updateInternalDomainObject(domainObject) {
            this.internalDomainObject = domainObject;
        }
    }
};
</script>
