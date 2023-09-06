<template>
  <div class="c-telemetry-frame">
    <div class="c-telemetry-frame__title-bar">
      <span class="c-telemetry-frame__title">
        <span class="c-telemetry-frame__title-icon icon-telemetry"></span>
        <span class="title-text">{{ telemetryObject.name }}</span>
      </span>
      <button title="More options" class="l-browse-bar__actions c-icon-button icon-3-dots" ref="menu-button"
        @click="toggleMenu">
      </button>
    </div>
    <div v-if="showMenu" class="c-menu c-menu__inspector-telemetry-options" aria-label="Telemetry Options"
      @blur="showMenu = false">
      <ul>
        <li v-if="telemetryObject.type === 'yamcs.telemetry'" role="menuitem" title="View Full Screen"
          class="icon-eye-open" @click="previewTelemetry">
          View Full Screen
        </li>
        <li role="menuitem" title="Open in a new browser tab" class="icon-new-window" @click="openInNewTab">
          Open In New Tab
        </li>
      </ul>
    </div>
    <slot></slot>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
  provide() {
    return {
      domainObject: this.telemetryObject
    };
  },
  props: {
    bounds: {
      type: Object,
      default: () => { }
    },
    telemetryObject: {
      type: Object,
      default: () => { }
    }
  },
  data() {
    return {
      showMenu: false,
    };
  },
  methods: {
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    async getTelemetryPath() {
      let sourceTelem;
      if (this.telemetryObject.type === 'yamcs.telemetry') {
        sourceTelem = this.openmct.objects.makeKeyString(this.telemetryObject.identifier);
      } else if (this.telemetryObject.type === 'yamcs.image') {
        sourceTelem = this.openmct.objects.makeKeyString(this.telemetryObject.identifier);
      }
      const telemetryPath = await this.openmct.objects.getOriginalPath(sourceTelem);
      return telemetryPath;
    },
    async openInNewTab() {
      const telemetryPath = await this.getTelemetryPath();
      const sourceTelemObject = telemetryPath[0];
      const timeBounds = this.bounds;
      const urlParams = {
        'tc.startBound': timeBounds?.start,
        'tc.endBound': timeBounds?.end,
        'tc.mode': 'fixed'
      };
      const newTabAction = this.openmct.actions.getAction('newTab');
      newTabAction.invoke([sourceTelemObject], urlParams);
      this.showMenu = false;
    },
    previewTelemetry() {
      const previewAction = this.openmct.actions.getAction('preview');
      previewAction.invoke([this.telemetryObject]);
      this.showMenu = false;
    }
  }
};
</script>
