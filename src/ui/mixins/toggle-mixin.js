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
export default {
  data() {
    return {
      open: false
    };
  },
  methods: {
    toggle(event) {
      if (this.open) {
        if (this.isOpening) {
          // Prevent document event handler from closing immediately
          // after opening.  Can't use stopPropagation because that
          // would break other menus with similar behavior.
          this.isOpening = false;

          return;
        }

        document.removeEventListener('click', this.toggle);
        this.open = false;
      } else {
        document.addEventListener('click', this.toggle);
        this.open = true;
        this.isOpening = true;
      }
    }
  },
  unmounted() {
    document.removeEventListener('click', this.toggle);
  }
};
