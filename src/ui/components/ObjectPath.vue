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
  <ul
    v-if="orderedPath.length"
    class="c-location"
    :aria-label="`${domainObject.name}`"
    role="navigation"
  >
    <li v-for="pathObject in orderedPath" :key="pathObject.key" class="c-location__item">
      <object-label
        :domain-object="pathObject.domainObject"
        :object-path="pathObject.objectPath"
        :read-only="readOnly"
        :navigate-to-path="navigateToPath(pathObject.objectPath)"
      />
    </li>
  </ul>
</template>

<script>
import ObjectLabel from './ObjectLabel.vue';

export default {
  components: {
    ObjectLabel
  },
  inject: ['openmct'],
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    readOnly: {
      type: Boolean,
      required: false,
      default() {
        return false;
      }
    },
    showObjectItself: {
      type: Boolean,
      required: false,
      default() {
        return false;
      }
    },
    objectPath: {
      type: Array,
      default() {
        return null;
      }
    }
  },
  data() {
    return {
      orderedPath: []
    };
  },
  async mounted() {
    const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

    if (keyString && this.keyString !== keyString) {
      this.keyString = keyString;
      this.originalPath = [];

      let rawPath = null;
      if (this.objectPath === null) {
        rawPath = await this.openmct.objects.getOriginalPath(keyString);
      } else {
        rawPath = this.objectPath;
      }

      const pathWithDomainObject = rawPath.map((domainObject, index, pathArray) => {
        let key = this.openmct.objects.makeKeyString(domainObject.identifier);
        const objectPath = pathArray.slice(index);

        return {
          domainObject,
          key,
          objectPath
        };
      });
      if (this.showObjectItself) {
        // remove ROOT only
        this.orderedPath = pathWithDomainObject.slice(0, pathWithDomainObject.length - 1).reverse();
      } else {
        // remove ROOT and object itself from path
        this.orderedPath = pathWithDomainObject.slice(1, pathWithDomainObject.length - 1).reverse();
      }
    }
  },
  methods: {
    /**
     * Generate the hash url for the given object path, removing the '/ROOT' prefix if present.
     * @param {import('../../api/objects/ObjectAPI').DomainObject[]} objectPath
     */
    navigateToPath(objectPath) {
      /** @type {String} */
      const path = `/browse/${this.openmct.objects.getRelativePath(objectPath)}`;

      return path.replace('ROOT/', '');
    }
  }
};
</script>
