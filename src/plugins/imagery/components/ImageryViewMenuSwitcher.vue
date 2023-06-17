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
  <div class="c-switcher-menu">
    <button
      :id="id"
      class="c-button c-button--menu c-switcher-menu__button"
      :class="iconClass"
      :title="title"
      @click="toggleMenu"
    >
      <span class="c-button__label"></span>
    </button>
    <div v-show="showMenu" class="c-switcher-menu__content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { v4 as uuid } from 'uuid';

export default {
  inject: ['openmct'],
  props: {
    iconClass: {
      type: String,
      default() {
        return '';
      }
    },
    title: {
      type: String,
      default() {
        return '';
      }
    }
  },
  data() {
    return {
      id: uuid(),
      showMenu: false
    };
  },
  mounted() {
    document.addEventListener('click', this.hideMenu);
  },
  destroyed() {
    document.removeEventListener('click', this.hideMenu);
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    hideMenu(e) {
      if (this.id === e.target.id) {
        return;
      }

      this.showMenu = false;
    }
  }
};
</script>
