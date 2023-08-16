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
  <div class="c-inspect-properties c-inspect-properties--location">
    <div class="c-inspect-properties__header" title="The location of this linked object.">
      Original Location
    </div>
    <ul class="c-inspect-properties__section">
      <li class="c-inspect-properties__row">
        <ul class="c-inspect-properties__value c-location">
          <li
            v-for="pathObject in orderedPathBreadCrumb"
            :key="pathObject.key"
            class="c-location__item"
          >
            <object-label
              :domain-object="pathObject.domainObject"
              :object-path="pathObject.objectPath"
            />
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
import ObjectLabel from '../../../ui/components/ObjectLabel.vue';

export default {
  components: {
    ObjectLabel
  },
  inject: ['openmct'],
  props: {
    domainObject: {
      type: Object,
      default: undefined
    },
    parentDomainObject: {
      type: Object,
      default: undefined
    }
  },
  data() {
    return {
      pathBreadCrumb: []
    };
  },
  computed: {
    orderedPathBreadCrumb() {
      return this.pathBreadCrumb.slice().reverse();
    }
  },
  async mounted() {
    this.nameChangeListeners = {};
    await this.createPathBreadCrumb();
  },
  unmounted() {
    Object.values(this.nameChangeListeners).forEach((unlisten) => {
      unlisten();
    });
  },
  methods: {
    updateObjectPathName(keyString, newName) {
      this.pathBreadCrumb = this.pathBreadCrumb.map((pathObject) => {
        if (this.openmct.objects.makeKeyString(pathObject.domainObject.identifier) === keyString) {
          return {
            ...pathObject,
            domainObject: { ...pathObject.domainObject, name: newName }
          };
        }
        return pathObject;
      });
    },
    removeNameListenerFor(domainObject) {
      const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      if (this.nameChangeListeners[keyString]) {
        this.nameChangeListeners[keyString]();
        delete this.nameChangeListeners[keyString];
      }
    },
    addNameListenerFor(domainObject) {
      const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      if (!this.nameChangeListeners[keyString]) {
        this.nameChangeListeners[keyString] = this.openmct.objects.observe(
          domainObject,
          'name',
          this.updateObjectPathName.bind(this, keyString)
        );
      }
    },
    async createPathBreadCrumb() {
      if (!this.domainObject && this.parentDomainObject) {
        this.setPathBreadCrumb([this.parentDomainObject]);
      } else {
        const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        const originalPath = await this.openmct.objects.getOriginalPath(keyString);
        const originalPathWithoutSelf = originalPath.slice(1, -1);

        this.setPathBreadCrumb(originalPathWithoutSelf);
      }
    },
    setPathBreadCrumb(path) {
      const pathBreadCrumb = path.map((domainObject, index, pathArray) => {
        const key = this.openmct.objects.makeKeyString(domainObject.identifier);

        return {
          domainObject,
          key,
          objectPath: pathArray.slice(index)
        };
      });

      this.pathBreadCrumb.forEach((pathObject) => {
        this.removeNameListenerFor(pathObject.domainObject);
      });

      this.pathBreadCrumb = pathBreadCrumb;

      this.pathBreadCrumb.forEach((pathObject) => {
        this.addNameListenerFor(pathObject.domainObject);
      });
    }
  }
};
</script>
