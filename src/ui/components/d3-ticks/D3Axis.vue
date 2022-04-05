<template>
<div
    ref="axisHolder"
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
            .attr('font-size', '1.5em');

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
        doTickUpdate() {
            const tickElements = this.$refs.axisHolder && this.$refs.axisHolder.querySelectorAll('.tick');
            if (tickElements) {
                const tickWidth = Number([].reduce.call(tickElements, function (memo, first) {
                    return Math.max(memo, first.getBoundingClientRect().width);
                }, 0));
                this.$emit('plotTickWidth', tickWidth);
                this.axisElement.attr("transform", `translate(${tickWidth + 30},0)`);
            }
        },
        drawAxis(bounds) {
            let viewBounds = Object.assign({}, bounds);

            this.setScale(viewBounds);
            this.setAxis(viewBounds);
            this.axisElement.call(this.xAxis);

            this.doTickUpdate();
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
            this.xAxis = d3Axis.axisLeft(this.xScale).tickFormat((d, i) => d);
        }
    }
};
</script>
