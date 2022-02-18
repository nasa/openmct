<template>
<div ref="axisHolder"
     class="c-d3-axis"
>
</div>
</template>

<script>
import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';

//TODO: UI direction needed for the following property values
const PADDING = 1;
const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;
//This offset needs to be re-considered

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        bounds: {
            type: Object,
            default() {
                return {};
            }
        },
        contentHeight: {
            type: Number,
            default() {
                return 0;
            }
        },
        offset: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    watch: {
        bounds(newBounds) {
            this.drawAxis(newBounds);
        }
    },
    mounted() {
        this.container = d3Selection.select(this.$refs.axisHolder);
        this.svgElement = this.container.append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis")
            .attr('font-size', '1.3em')
            .attr("transform", "translate(25,0)");

        this.setDimensions();
        this.drawAxis(this.bounds);
        this.resizeTimer = setInterval(this.resize, RESIZE_POLL_INTERVAL);
    },
    destroyed() {
        clearInterval(this.resizeTimer);
    },
    methods: {
        resize() {
            if (this.$refs.axisHolder.clientHeight !== this.height) {
                this.setDimensions();
                this.drawAxis(this.bounds);
            }
        },
        setDimensions() {
            const axisHolder = this.$refs.axisHolder;
            this.width = axisHolder.clientWidth;

            this.height = axisHolder.clientHeight;
            this.offsetHeight = this.height - this.offset;

            this.svgElement.attr("width", this.width);
            this.svgElement.attr("height", this.height);
        },
        drawAxis(bounds) {
            let viewBounds = Object.assign({}, bounds);

            this.setScale(viewBounds);
            this.setAxis(viewBounds);
            this.axisElement.call(this.xAxis);

        },
        setScale(bounds) {
            if (!this.height) {
                return;
            }

            this.xScale = d3Scale.scaleSymlog();
            if (bounds.start < 0) {
                this.xScale.domain(
                    [bounds.end, bounds.start]
                );
            } else {
                this.xScale.domain(
                    [bounds.start, bounds.end]
                );
            }

            this.xScale.range([PADDING, this.offsetHeight - PADDING * 2]);
        },
        setAxis() {
            this.xAxis = d3Axis.axisLeft(this.xScale);
            //
            // if (this.height > 1800) {
            //     this.xAxis.ticks(this.offsetHeight / PIXELS_PER_TICK_WIDE);
            // } else {
            //     this.xAxis.ticks(this.offsetHeight / PIXELS_PER_TICK);
            // }
        }
    }
};
</script>
