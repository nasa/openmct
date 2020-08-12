<template>
<div ref="axisHolder"
     class="c-timeline-plan"
>
</div>
</template>

<script>
import Activity from "./Activity.vue";
import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
// import utcMultiTimeFormat from '../timeConductor/utcMultiTimeFormat.js';

const PADDING = 1;
// const DEFAULT_DURATION_FORMATTER = 'duration';
// const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        Activity
    },
    data() {
        return {
            activities: []
        };
    },
    mounted() {
        this.viewBounds = this.openmct.time.bounds();
        this.xAxis = d3Axis.axisTop();

        this.svgElement = d3Selection.select(this.$refs.axisHolder).append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis");

        this.setAxisDimensions();
        this.setScale();
        // setInterval(this.resize, RESIZE_POLL_INTERVAL);
        this.plotActivity();

    },
    methods: {
        setAxisDimensions() {
            const axisHolder = this.$refs.axisHolder;
            const rect = axisHolder.getBoundingClientRect();
            this.left = Math.round(rect.left);
            this.top = Math.round(rect.top);
            this.height = Math.round(rect.height);
            this.width = axisHolder.clientWidth;
        },
        setScale() {
            if (!this.width) {
                return;
            }

            let timeSystem = this.openmct.time.timeSystem();

            if (timeSystem.isUTCBased) {
                this.xScale = d3Scale.scaleUtc();
                this.xScale.domain(
                    [new Date(this.viewBounds.start), new Date(this.viewBounds.end)]
                );
            } else {
                this.xScale = d3Scale.scaleLinear();
                this.xScale.domain(
                    [this.viewBounds.start, this.viewBounds.end]
                );
            }

            this.xScale.range([PADDING, this.width - PADDING * 2]);

            this.xAxis.scale(this.xScale);

            this.axisElement.call(this.xAxis);

            if (this.width > 1800) {
                this.xAxis.ticks(this.width / PIXELS_PER_TICK_WIDE);
            } else {
                this.xAxis.ticks(this.width / PIXELS_PER_TICK);
            }
        },
        sort(items, key) {
            items.sort(function (a, b) {
                if (a[key] > b[key]) {
                    return 1;
                } else if (a[key] < b[key]) {
                    return -1;
                }

                return 0;
            });

            return items;
        },
        getYForRect(rectX, rectWidth) {
            // new start between rect start and end?
            // new end is between rect start and end
            let currentY = this.top;
            let rects = this.svgElement.selectAll('rect').nodes().map(rect => {
                const start = rect.getAttribute('x');
                const end = rect.getAttribute('width');
                const y = rect.getAttribute('y');
                const hasOverlap = (rectX >= start && rectX <= end) || (rectWidth >= start && rectWidth <= end);

                return {
                    overlap: hasOverlap,
                    y: y
                };
            });
            rects = this.sort(rects, 'y');
            let overlappingRects = {};

            rects.forEach(rect => {
                if (!overlappingRects[rect.y]) {
                    overlappingRects[rect.y] = rect.overlap;
                }
            });

            let y = Object.keys(overlappingRects).find(key => {
                return !overlappingRects[key];
            });


            if (y !== undefined) {
                currentY = y;
            } else if (rects.length) {
                return parseInt(rects[rects.length - 1].y, 10) + 20;
            }

            return currentY;
        },
        plotActivity() {
            this.activities = this.domainObject.configuration.activities.map(activity => activity);
            this.activities = this.sort(this.activities, 'start');
            let currentStart;
            let currentEnd;
            let rectY = this.top;
            this.activities.forEach((activity) => {
                if (activity.start < this.viewBounds.end) {
                    currentStart = Math.max(this.viewBounds.start, activity.start);
                    currentEnd = Math.min(this.viewBounds.end, activity.end);
                    const rectX = this.xScale(currentStart);
                    const rectWidth = this.xScale(currentEnd);

                    rectY = this.getYForRect(rectX, rectWidth);

                    this.svgElement.append("rect")
                        .attr("class", "activity")
                        .attr("x", rectX)
                        .attr("y", rectY)
                        .attr("width", rectWidth)
                        .attr("height", 20)
                        .attr('fill', activity.color)
                        .attr('stroke', "lightgray");
                    this.svgElement.append("text").text(activity.name)
                        .attr("class", "activity")
                        .attr("x", rectX + PADDING * 5)
                        .attr("y", parseInt(rectY, 10) + 15)
                        .attr('fill', activity.textColor);
                }
            });
        }
    }
};
</script>
