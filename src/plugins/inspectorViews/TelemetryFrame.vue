<template>
<div></div>
</template>

<script>
import mount from '../../utils/mount';

export default {
  inject: [
    'openmct'
  ],
  props: {
    // bounds: {
    //     type: Object,
    //     required: true
    // },
    telemetryKey: {
      type: String,
      required: true
    }
  },
  computed: {

  },
  data() {
    return {
      telemetryObject: undefined,
      loaded: false
    }
  },
  async mounted() {
    this.telemetryObject = await this.openmct.objects.get(this.telemetryKey);

    this.renderPlot();
    this.loaded = true;
  },
  methods: {
    renderPlot() {
      const { vNode, destroy } = mount(
        {
          components: {
            Plot: this.openmct.components.Plot
          },
          provide: {
            openmct,
            domainObject: this.telemetryObject,
            path: [ this.telemetryObject ]
          },
          methods: {
            loadingUpdated(loaded) {
              this.loading = loaded;
            }
          },
          template: `<Plot />`
        },
        {
          app: this.openmct.app,
          element: this.$el
        }
      );
      this.component = vNode.componentInstance;
      this._destroy = destroy;

    },
    setIndependentTimeContextForComponent() {
      // this.unregisterTimeContextList = [];
      // this.plotObjects.forEach((plotObject) => {
      //     const keyString = this.openmct.objects.makeKeyString(plotObject.identifier);

      //     // get an independent time context for object
      //     this.openmct.time.getContextForView([plotObject]);
      //     // set the time context of the object to the selected time range
      //     this.unregisterTimeContextList.push(this.openmct.time.addIndependentContext(keyString, this.bounds));
      // });
    },
    renderComponent() {
      // this.elementsList = [];
      // this.componentsList = [];
      // const bounds = this.bounds;

      // this.plotObjects.forEach((proxyPlotObject) => {
      //     const plotObject = toRaw(proxyPlotObject);
      //     const { vNode, destroy } = mount(
      //       {
      //         components: {
      //             TelemetryFrame,
      //         },
      //         provide: {
      //             openmct: this.openmct,
      //             path: [ plotObject ]
      //         },
      //         data() {
      //             return {
      //                 plotObject,
      //                 bounds,
      //             };
      //         },
      //         template: `<TelemetryFrame
      //                         :bounds="bounds"
      //                         :telemetry-object="plotObject"
      //                     >
      //                 </TelemetryFrame>`
      //     },
      //       {
      //         app: this.openmct.app
      //       }
      //     );

      //     this.componentsList.push(destroy);
      //     this.elementsList.push(vNode.el);
      //     this.$refs.numericDataView.append(vNode.el);
      // });
    },
    destroyComponent() {
      // if (this.componentsList) {
      //     this.componentsList.map(destroy => destroy());
      //     delete this.componentsList;
      // }

      // if (this.elementsList) {
      //     this.elementsList.map((element) => element.remove());
      //     delete this.elementsList;
      // }

      // if (this.plotObjects) {
      //     this.plotObjects = [];
      // }

      // if (this.unregisterTimeContextList) {
      //     this.unregisterTimeContextList.map((unregisterTimeContext) => unregisterTimeContext());
      //     delete this.unregisterTimeContextList;
      // }
    }
  },
  beforeUnmount() {
    // this.destroyComponent();
  }
}
</script>
