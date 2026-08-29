/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
const unknownObjectType = {
  definition: {
    cssClass: 'icon-object-unknown',
    name: 'Unknown Type'
  }
};

export default {
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      items: []
    };
  },
  mounted() {
    this.composition = this.openmct.composition.get(this.domainObject);
    this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    if (!this.composition) {
      return;
    }

    this.composition.on('add', this.add);
    this.composition.on('remove', this.remove);
    this.composition.load();
  },
  beforeUnmount() {
    if (!this.composition) {
      return;
    }
    this.composition.off('add', this.add);
    this.composition.off('remove', this.remove);
  },
  methods: {
    add(child, index, anything) {
      const type = this.openmct.types.get(child.type) || unknownObjectType;
      this.items.push({
        model: child,
        type: type.definition,
        isAlias: this.keystring !== child.location,
        objectPath: [child].concat(this.openmct.router.path),
        objectKeyString: this.openmct.objects.makeKeyString(child.identifier)
      });
    },
    remove(identifier) {
      this.items = this.items.filter((i) => {
        return (
          i.model.identifier.key !== identifier.key ||
          i.model.identifier.namespace !== identifier.namespace
        );
      });
    }
  }
};
