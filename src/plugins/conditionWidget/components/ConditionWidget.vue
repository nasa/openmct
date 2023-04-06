/*****************************************************************************
* Open MCT, Copyright (c) 2014-2023, United States Government
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
    :target="url ? '_BLANK' : ''"
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
            conditionalLabel: '',
            conditionSetIdentifier: null,
            domainObjectLabel: '',
            url: null,
            urlDefined: false,
            useConditionSetOutputAsLabel: false
        };
    },
    computed: {
        label() {
            return this.useConditionSetOutputAsLabel
                ? this.conditionalLabel
                : this.domainObjectLabel
            ;
        }
    },
    watch: {
        conditionSetIdentifier: {
            handler(newValue, oldValue) {
                if (!oldValue || !newValue || !this.openmct.objects.areIdsEqual(newValue, oldValue)) {
                    return;
                }

                this.listenToConditionSetChanges();
            },
            deep: true
        }
    },
    mounted() {
        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject);

        if (this.domainObject) {
            this.updateDomainObject(this.domainObject);
            this.listenToConditionSetChanges();
        }
    },
    beforeDestroy() {
        this.conditionSetIdentifier = null;

        if (this.unlisten) {
            this.unlisten();
        }

        this.stopListeningToConditionSetChanges();
    },
    methods: {
        async listenToConditionSetChanges() {
            if (!this.conditionSetIdentifier) {
                return;
            }

            const conditionSetDomainObject = await this.openmct.objects.get(this.conditionSetIdentifier);
            this.stopListeningToConditionSetChanges();

            if (!conditionSetDomainObject) {
                this.openmct.notifications.alert('Unable to find condition set');
            }

            this.telemetryCollection = this.openmct.telemetry.requestCollection(conditionSetDomainObject, {
                size: 1,
                strategy: 'latest'
            });

            this.telemetryCollection.on('add', this.updateConditionLabel, this);
            this.telemetryCollection.load();
        },
        stopListeningToConditionSetChanges() {
            if (this.telemetryCollection) {
                this.telemetryCollection.off('add', this.updateConditionLabel, this);
                this.telemetryCollection.destroy();
                this.telemetryCollection = null;
            }
        },
        updateConditionLabel([latestDatum]) {
            if (!this.conditionSetIdentifier) {
                this.stopListeningToConditionSetChanges();

                return;
            }

            this.conditionalLabel = latestDatum.output || '';
        },
        updateDomainObject(domainObject) {
            if (this.domainObjectLabel !== domainObject.label) {
                this.domainObjectLabel = domainObject.label;
            }

            const urlDefined = domainObject.url && domainObject.url.length > 0;
            if (this.urlDefined !== urlDefined) {
                this.urlDefined = urlDefined;
            }

            const url = this.urlDefined ? sanitizeUrl(domainObject.url) : null;
            if (this.url !== url) {
                this.url = url;
            }

            const conditionSetIdentifier = domainObject.configuration?.objectStyles?.conditionSetIdentifier;
            if (conditionSetIdentifier && this.conditionSetIdentifier !== conditionSetIdentifier) {
                this.conditionSetIdentifier = conditionSetIdentifier;
            }

            const useConditionSetOutputAsLabel = this.conditionSetIdentifier && domainObject.configuration.useConditionSetOutputAsLabel;
            if (this.useConditionSetOutputAsLabel !== useConditionSetOutputAsLabel) {
                this.useConditionSetOutputAsLabel = useConditionSetOutputAsLabel;
            }
        }
    }
};
</script>
