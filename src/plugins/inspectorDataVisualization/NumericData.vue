<template>
  <div class="c-inspector__numeric-data">
    <div class="c-inspect-properties__header">Numeric Data</div>

    <div ref="numericDataView"></div>

    <div v-if="!hasNumericData">
      Toggle layer visibility and select new location in Map Tool to view associated telemetry.
    </div>
  </div>
</template>
<script>
import mount from 'utils/mount';
import TelemetryFrame from './TelemetryFrame.vue';
import Plot from '../plot/Plot.vue';

export default {
  inject: ['openmct', 'domainObject', 'timeFormatter'],
  props: {
    bounds: {
      type: Object,
      required: true
    },
    telemetryKeys: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      plotObjects: []
    };
  },
  computed: {
    hasNumericData() {
      return this.plotObjects.length > 0;
    }
  },
  watch: {
    telemetryKeys: {
      handler() {
        this.renderNumericData();
      },
      deep: true
    },
    bounds: {
      handler() {
        this.renderNumericData();
      },
      deep: true
    }
  },
  mounted() {
    this.renderNumericData();
  },
  beforeUnmount() {
    this.clearPlots();
  },
  methods: {
    renderNumericData() {
      this.clearPlots();

      this.unregisterTimeContextList = [];
      this.elementsList = [];
      this.componentsList = [];

      this.telemetryKeys.forEach(async (telemetryKey) => {
        const plotObject = await this.openmct.objects.get(telemetryKey);

        this.plotObjects.push(plotObject);
        this.unregisterTimeContextList.push(this.setIndependentTimeContextForComponent(plotObject));
        this.renderPlot(plotObject);
      });
    },
    setIndependentTimeContextForComponent(plotObject) {
      const keyString = this.openmct.objects.makeKeyString(plotObject.identifier);

      // get an independent time context for object
      this.openmct.time.getContextForView([plotObject]);
      // set the time context of the object to the selected time range
      return this.openmct.time.addIndependentContext(keyString, this.bounds);
    },
    renderPlot(plotObject) {
      const { vNode, destroy } = mount(
        {
          components: {
            TelemetryFrame,
            Plot
          },
          provide: {
            openmct: this.openmct,
            path: [plotObject]
          },
          data() {
            return {
              plotObject,
              bounds: this.bounds
            };
          },
          template: `<TelemetryFrame
                      :bounds="bounds"
                      :telemetry-object="plotObject"
                    >
                      <Plot />
                    </TelemetryFrame>`
        },
        {
          app: this.openmct.app
        }
      );

      this.componentsList.push(destroy);
      this.elementsList.push(vNode.el);
      this.$refs.numericDataView.append(vNode.el);
    },
    clearPlots() {
      if (this.componentsList?.length) {
        this.componentsList.forEach((destroy) => destroy());
        delete this.componentsList;
      }

      if (this.elementsList?.length) {
        this.elementsList.forEach((element) => element.remove());
        delete this.elementsList;
      }

      if (this.plotObjects?.length) {
        this.plotObjects = [];
      }

      if (this.unregisterTimeContextList?.length) {
        this.unregisterTimeContextList.forEach((unregisterTimeContext) => unregisterTimeContext());
        delete this.unregisterTimeContextList;
      }
    }
  }
};
</script>
