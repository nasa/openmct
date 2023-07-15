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
  <div ref="aboutLogo" class="l-shell__app-logo" @click="launchAbout"></div>
</template>

<script>
import AboutDialog from './AboutDialog.vue';
import mount from 'utils/mount';

export default {
  inject: ['openmct'],
  mounted() {
    const branding = this.openmct.branding();
    if (branding.smallLogoImage) {
      this.$refs.aboutLogo.style.backgroundImage = `url('${branding.smallLogoImage}')`;
    }
  },
  methods: {
    launchAbout() {
      const { el, destroy } = mount(
        {
          components: { AboutDialog },
          provide: {
            openmct: this.openmct
          },
          template: '<about-dialog></about-dialog>'
        },
        {
          app: this.openmct.app
        }
      );

      el.classList.add('u-contents');

      this.openmct.overlays.overlay({
        element: el,
        size: 'large',
        onDestroy: destroy
      });
    }
  }
};
</script>
