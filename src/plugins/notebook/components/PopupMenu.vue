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
  <button
    class="c-popup-menu-button c-disclosure-button"
    title="Open context menu"
    @click="showMenuItems"
  ></button>
</template>

<script>
import MenuItems from './MenuItems.vue';
import Vue from 'vue';

export default {
  inject: ['openmct'],
  props: {
    domainObject: {
      type: Object,
      default() {
        return {};
      }
    },
    popupMenuItems: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  data() {
    return {
      menuItems: null
    };
  },
  mounted() {},
  methods: {
    calculateMenuPosition(event, element) {
      let eventPosX = event.clientX;
      let eventPosY = event.clientY;

      let menuDimensions = element.getBoundingClientRect();
      let overflowX = eventPosX + menuDimensions.width - document.body.clientWidth;
      let overflowY = eventPosY + menuDimensions.height - document.body.clientHeight;

      if (overflowX > 0) {
        eventPosX = eventPosX - overflowX;
      }

      if (overflowY > 0) {
        eventPosY = eventPosY - overflowY;
      }

      return {
        x: eventPosX,
        y: eventPosY
      };
    },
    hideMenuItems() {
      document.body.removeChild(this.menuItems.$el);
      this.menuItems.$destroy();
      this.menuItems = null;
      document.removeEventListener('click', this.hideMenuItems);

      return;
    },
    showMenuItems($event) {
      if (this.menuItems) {
        this.hideMenuItems();
      }

      const menuItems = new Vue({
        components: {
          MenuItems
        },
        provide: {
          popupMenuItems: this.popupMenuItems
        },
        template: '<MenuItems />'
      });
      this.menuItems = menuItems;

      menuItems.$mount();
      const element = this.menuItems.$el;
      document.body.appendChild(element);

      const position = this.calculateMenuPosition($event, element);
      element.style.left = `${position.x}px`;
      element.style.top = `${position.y}px`;

      setTimeout(() => {
        document.addEventListener('click', this.hideMenuItems);
      }, 0);
    }
  }
};
</script>
