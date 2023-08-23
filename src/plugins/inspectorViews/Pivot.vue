<template>
<div class="c-inspector__numeric-data">
    <div class="c-inspect-properties__header">
        Numeric Data
    </div>

    <div v-if="hasNumericData">
        <TelemetryFrame
          v-for="telemetryKey in telemetryKeys"
          :key="telemetryKey"
          :telemetry-key="telemetryKey"
        />
    </div>
    <div v-else>
      nothing
    </div>
</div>
</template>
<script>
import TelemetryFrame from './TelemetryFrame.vue';

export default {
    inject: [
        'openmct'
    ],
    components: {
      TelemetryFrame
    },
    props: {
        // bounds: {
        //     type: Object,
        //     required: true
        // },
        // telemetryKeys: {
        //     type: Array,
        //     default: () => []
        // }
    },
    watch: {
        // telemetryKeys: {
        //     handler() {
        //         this.renderNumericData();
        //     },
        //     deep: true
        // },
        // bounds: {
        //     handler() {
        //         this.renderNumericData();
        //     },
        //     deep: true
        // }
    },
    computed: {
        hasNumericData() {
            return this.telemetryKeys?.length;
        }
    },
    data() {
        return {
            telemetryKeys: ['9852db1e-a08a-41a0-b668-810a14327344']
        }
    },
    mounted() {
    },
    methods: {
        // async renderNumericData() {
        //     // this.destroyComponent();

        //     const telemetryKeys = [];

        //     telemetryKeys.map((telemetryKey) => this.plotObjects.push(this.openmct.objects.get(telemetryKey)));
        //     await Promise.all(this.plotObjects);

        //     // this.setIndependentTimeContextForComponent();

        //     // this.renderComponent();
        //     this.ready = true;
        // },
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
    }
}
</script>
