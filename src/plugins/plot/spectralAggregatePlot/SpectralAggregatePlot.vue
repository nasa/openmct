<template>
<div ref="plotWrapper"
     class="has-local-controls"
     :class="{ 's-unsynced' : isZoomed }"
>
    <div v-if="isZoomed"
         class="l-state-indicators"
    >
        <span class="l-state-indicators__alert-no-lad t-object-alert t-alert-unsynced icon-alert-triangle"
              title="This plot is not currently displaying the latest data. Reset pan/zoom to view latest data."
        ></span>
    </div>
    <div ref="plot"
         class="c-spectral-aggregate-plot__plot"
    ></div>
    <div ref="localControl"
         class="gl-plot__local-controls h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover"
    >
        <button v-if="data.length"
                class="c-button icon-reset"
                :disabled="!isZoomed"
                title="Reset pan/zoom"
                @click="reset()"
        >
        </button>
    </div>
</div>
</template>
<script>
import Plotly from 'plotly.js/dist/plotly';
import { HOVER_VALUES_CLEARED, HOVER_VALUES_CHANGED, SUBSCRIBE, UNSUBSCRIBE } from './SpectralAggregateConstants';

const PLOT_PADDING_IN_PERCENT = 1;
const MULTI_AXES_X_PADDING_PERCENT = {
    LEFT: 8,
    RIGHT: 94
};

export default {
    inject: ['openmct', 'domainObject'],
    props: [
        'data',
        'legendExpanded',
        'plotAxisTitle'
    ],
    data() {
        return {
            isZoomed: false,
            primaryYAxisRange: {
                min: '',
                max: ''
            },
            xAxisRange: {
                min: '',
                max: ''
            }
        };
    },
    watch: {
        data: {
            immediate: false,
            handler: 'updateData'
        },
        legendExpanded: {
            immediate: false,
            handler: 'updatePlot'
        }
    },
    mounted() {
        Plotly.newPlot(this.$refs.plot, Array.from(this.data), this.getLayout(), {
            responsive: true,
            displayModeBar: false
        });
        this.registerListeners();
    },
    beforeDestroy() {
        this.$refs.plot.removeAllListeners();

        if (this.plotResizeObserver) {
            this.plotResizeObserver.unobserve(this.$refs.plotWrapper);
            clearTimeout(this.resizeTimer);
        }
    },
    methods: {
        getAxisMinMax(axis) {
            const min = axis.autoSize
                ? ''
                : axis.min;
            const max = axis.autoSize
                ? ''
                : axis.max;

            return {
                min,
                max
            };
        },
        getAxisPadding(min, max) {
            return (Math.abs(max - min) * PLOT_PADDING_IN_PERCENT / 100) || 0;
        },
        getLayout() {
            const yAxesMeta = this.getYAxisMeta();
            const primaryYaxis = this.getYaxisLayout(yAxesMeta['1']);
            const xAxisDomain = this.getXAxisDomain(yAxesMeta);

            return {
                // hovermode: 'closest',
                // hoverdistance: -1,
                autosize: true,
                showlegend: false,
                font: {
                    family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    size: '12px',
                    color: '#666'
                },
                xaxis: {
                    domain: xAxisDomain,
                    // hoverformat: '.2r',
                    range: [this.xAxisRange.min, this.xAxisRange.max],
                    title: this.plotAxisTitle.xAxisTitle
                    // zeroline: false
                },
                yaxis: primaryYaxis,
                margin: {
                    l: 40,
                    r: 10,
                    b: 40,
                    t: 20
                },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent'
            };
        },
        getYAxisMeta() {
            const yAxisMeta = {};

            this.data.forEach(d => {
                const yAxisMetadata = d.yAxisMetadata;
                const range = '1';
                const side = 'left';
                const name = '';
                const unit = yAxisMetadata.units;

                yAxisMeta[range] = {
                    range,
                    side,
                    name,
                    unit
                };
            });

            return yAxisMeta;
        },
        getXAxisDomain(yAxisMeta) {
            let leftPaddingPerc = 0;
            let rightPaddingPerc = 100;
            let rightSide = yAxisMeta && Object.values(yAxisMeta).filter((axisMeta => axisMeta.side === 'right'));
            let leftSide = yAxisMeta && Object.values(yAxisMeta).filter((axisMeta => axisMeta.side === 'left'));
            if (yAxisMeta && rightSide.length > 1) {
                rightPaddingPerc = MULTI_AXES_X_PADDING_PERCENT.RIGHT;
            }

            if (yAxisMeta && leftSide.length > 1) {
                leftPaddingPerc = MULTI_AXES_X_PADDING_PERCENT.LEFT;
            }

            return [leftPaddingPerc / 100, rightPaddingPerc / 100];
        },
        getYaxisLayout(yAxisMeta) {
            if (!yAxisMeta) {
                return {};
            }

            const { name, range, side = 'left', unit } = yAxisMeta;
            const title = `${name} ${unit ? '(' + unit + ')' : ''}`;
            const yaxis = {
                // hoverformat: '.2r',
                // showgrid: true,
                title
                // zeroline: false
            };

            let yAxistype = this.primaryYAxisRange;
            if (range === '1') {
                yaxis.range = [yAxistype.min, yAxistype.max];

                return yaxis;
            }

            yaxis.range = [yAxistype.min, yAxistype.max];
            yaxis.anchor = side.toLowerCase() === 'left'
                ? 'free'
                : 'x';
            yaxis.showline = side.toLowerCase() === 'left';
            yaxis.side = side.toLowerCase();
            yaxis.overlaying = 'y';
            yaxis.position = 0.01;

            return yaxis;
        },
        handleHover(isHovered, itemValues) {
            return () => {
                this.updateLocalControlPosition(isHovered);

                const eventName = isHovered ? HOVER_VALUES_CHANGED : HOVER_VALUES_CLEARED;
                this.$emit(eventName, { itemValues });
            };
        },
        registerListeners() {
            this.$refs.plot.on('plotly_hover', this.handleHover.bind(this, true));
            this.$refs.plot.on('plotly_unhover', this.handleHover.bind(this, false));
            this.$refs.plot.on('plotly_relayout', this.zoom);
            this.resizeTimer = false;
            if (window.ResizeObserver) {
                this.plotResizeObserver = new ResizeObserver(() => {
                    // debounce and trigger window resize so that plotly can resize the plot
                    clearTimeout(this.resizeTimer);
                    this.resizeTimer = setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 250);
                });
                this.plotResizeObserver.observe(this.$refs.plotWrapper);
            }
        },
        reset() {
            this.updatePlot();

            this.isZoomed = false;
            this.$emit(SUBSCRIBE);
        },
        updateData() {
            this.updatePlot();
        },
        updateLocalControlPosition() {
            const localControl = this.$refs.localControl;
            localControl.style.display = 'none';

            const plot = this.$refs.plot;
            const bgLayer = this.$el.querySelector('.bglayer');

            const plotBoundingRect = plot.getBoundingClientRect();
            const bgLayerBoundingRect = bgLayer.getBoundingClientRect();

            const top = bgLayerBoundingRect.top - plotBoundingRect.top + 5;
            const left = bgLayerBoundingRect.left - plotBoundingRect.left + 5;

            localControl.style.top = `${top}px`;
            localControl.style.left = `${left}px`;
            localControl.style.display = 'block';
        },
        updatePlot() {
            if (!this.$refs || !this.$refs.plot) {
                return;
            }

            Plotly.react(this.$refs.plot, Array.from(this.data), this.getLayout());
        },
        zoom(eventData) {
            const autorange = eventData['xaxis.autorange'];
            const { autosize } = eventData;

            if (autosize || autorange) {
                this.isZoomed = false;
                this.reset();

                return;
            }

            this.isZoomed = true;
            this.$emit(UNSUBSCRIBE);
        }
    }
};
</script>

<style lang="scss">
    .c-spectral-aggregate-plot__plot {
        height: 100%;
    }

    .c-spectral-aggregate-plot-view .gl-plot__local-controls {
        top: 25px;
    }

    .has-local-controls {
        border: 1px solid transparent;
    }
</style>

