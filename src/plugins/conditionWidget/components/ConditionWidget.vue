<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <div ref="conditionWidgetElement" class="c-condition-widget u-style-receiver js-style-receiver">
    <component :is="urlDefined ? 'a' : 'div'" class="c-condition-widget__label-wrapper" :href="url">
      <div class="c-condition-widget__label">{{ label }}</div>
    </component>
  </div>
</template>

<script>
const sanitizeUrl = require('@braintree/sanitize-url').sanitizeUrl;

export default {
  inject: ['openmct', 'domainObject'],
  data: function () {
    return {
      conditionalLabel: ''
    };
  },
  computed: {
    urlDefined() {
      return this.domainObject.url?.length > 0;
    },
    url() {
      return this.urlDefined ? sanitizeUrl(this.domainObject.url) : null;
    },
    useConditionSetOutputAsLabel() {
      return (
        this.conditionSetIdentifier && this.domainObject.configuration.useConditionSetOutputAsLabel
      );
    },
    conditionSetIdentifier() {
      return this.domainObject.configuration?.objectStyles?.conditionSetIdentifier;
    },
    label() {
      return this.useConditionSetOutputAsLabel ? this.conditionalLabel : this.domainObject.label;
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
    if (this.domainObject) {
      this.listenToConditionSetChanges();
    }
  },
  beforeDestroy() {
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

      this.telemetryCollection = this.openmct.telemetry.requestCollection(
        conditionSetDomainObject,
        {
          size: 1,
          strategy: 'latest'
        }
      );

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
    }
  }
};
</script>
