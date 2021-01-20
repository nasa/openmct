<template>
</template>
<script>

import MctPlot from '../single/MctPlot.vue';
import Vue from "vue";

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        object: {
            type: Object,
            default() {
                return {};
            }
        },
        gridLines: {
            type: Boolean,
            default() {
                return true;
            }
        },
        cursorGuide: {
            type: Boolean,
            default() {
                return true;
            }
        },
        plotTickWidth: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    watch: {
        gridLines(newGridLines) {
            this.updateComponentProp('gridLines', newGridLines);
        },
        cursorGuide(newCursorGuide) {
            this.updateComponentProp('cursorGuide', newCursorGuide);
        },
        plotTickWidth(width) {
            this.updateComponentProp('plotTickWidth', width);
        }
    },
    mounted() {
        this.updateView();
    },
    methods: {
        updateComponentProp(prop, value) {
            if (this.component) {
                this.component[prop] = value;
            }
        },
        updateView() {
            if (this.component) {
                this.component.$destroy();
                this.component = undefined;
                this.$el.innerHTML = '';
            }

            const onTickWidthChange = this.onTickWidthChange;
            const loadingUpdated = this.loadingUpdated;

            const openmct = this.openmct;
            const object = this.object;

            const getProps = this.getProps;

            this.component = new Vue({
                provide: {
                    openmct,
                    domainObject: object
                },
                el: this.$el,
                components: {
                    MctPlot
                },
                data() {
                    return {
                        ...getProps(),
                        onTickWidthChange,
                        loadingUpdated
                    };
                },
                template: '<div ref="plotWrapper" class="l-view-section u-style-receiver js-style-receiver"><div v-show="!!loading" class="c-loading--overlay loading"></div><mct-plot :grid-lines="gridLines" :cursor-guide="cursorGuide" :plot-tick-width="plotTickWidth" @plotTickWidth="onTickWidthChange" @loadingUpdated="loadingUpdated"/></div>'
            });
        },
        onTickWidthChange() {
            this.$emit('plotTickWidth', ...arguments);
        },
        loadingUpdated(loaded) {
            this.loading = loaded;
        },
        getProps() {
            return {
                gridLines: this.gridLines,
                cursorGuide: this.cursorGuide,
                plotTickWidth: this.plotTickWidth,
                loading: this.loading
            };
        }
    }
};
</script>
