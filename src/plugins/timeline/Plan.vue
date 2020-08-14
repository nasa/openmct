<template>
<div ref="axisHolder"
     class="c-timeline-plan"
>
</div>
</template>

<script>
import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
// import utcMultiTimeFormat from '../timeConductor/utcMultiTimeFormat.js';

const PADDING = 1;
const TEXT_PADDING = 15;
// const DEFAULT_DURATION_FORMATTER = 'duration';
// const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;
const ROW_HEIGHT = 20;

export default {
    inject: ['openmct', 'domainObject'],
    mounted() {
        this.activityPositions = {};
        this.viewBounds = this.openmct.time.bounds();
        this.xAxis = d3Axis.axisTop();

        this.container = d3Selection.select(this.$refs.axisHolder);
        this.svgElement = this.container.append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis");

        this.canvas = this.container.append('canvas').node();
        this.canvasContext = this.canvas.getContext('2d');

        this.setDimensions();
        this.setScale();

        // setInterval(this.resize, RESIZE_POLL_INTERVAL);
        this.plotActivity();

    },
    methods: {
        setDimensions() {
            const axisHolder = this.$refs.axisHolder;
            this.width = axisHolder.clientWidth;
            this.canvas.width = this.width;
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
        isActivityInBounds(activity) {
            return (activity.start < this.viewBounds.end) && (activity.end > this.viewBounds.start);
        },
        getTextWidth(name) {
            // canvasContext.font = font;
            let metrics = this.canvasContext.measureText(name);

            return parseInt(metrics.width, 10);
        },
        // Get the row where the next activity will land.
        getRowForActivity(rectX, rectWidth) {
            let activityRow;
            let sortedActivityRows = Object.keys(this.activityPositions).sort();
            for (let i = 0; i < sortedActivityRows.length; i++) {
                let row = sortedActivityRows[i];
                let noOverlap = this.activityPositions[row].every(rect => {
                    const start = rect.start;
                    const end = rect.end;
                    const hasOverlap = (rectX >= start && rectX <= end) || (rectWidth >= start && rectWidth <= end);

                    return !hasOverlap;
                });
                if (noOverlap) {
                    activityRow = row;
                    break;
                }
            }

            if (!activityRow && sortedActivityRows.length) {
                activityRow = parseInt(sortedActivityRows[sortedActivityRows.length - 1], 10) + ROW_HEIGHT;
            }

            return activityRow || 0;
        },
        plotActivity() {
            let currentStart;
            let currentEnd;
            const canvasDim = this.canvas.getBoundingClientRect();
            console.log(canvasDim);
            let activityRow = 0;
            this.domainObject.configuration.activities.forEach((activity) => {
                if (this.isActivityInBounds(activity)) {
                    currentStart = Math.max(this.viewBounds.start, activity.start);
                    currentEnd = Math.min(this.viewBounds.end, activity.end);
                    const rectX = this.xScale(currentStart);
                    const rectWidth = this.xScale(currentEnd);

                    const activityNameWidth = this.getTextWidth(activity.name) + PADDING;
                    const canFitText = (rectWidth > activityNameWidth);
                    const textStart = canFitText ? rectX + PADDING : rectX + rectWidth + PADDING;

                    if (canFitText) {
                        activityRow = this.getRowForActivity(rectX, rectWidth);
                    } else {
                        activityRow = this.getRowForActivity(rectX, (textStart + activityNameWidth));
                    }

                    if (!this.activityPositions[activityRow]) {
                        this.activityPositions[activityRow] = [];
                    }

                    this.activityPositions[activityRow].push({
                        start: rectX,
                        end: canFitText ? rectWidth : textStart + activityNameWidth
                    });

                    this.canvasContext.fillStyle = activity.color;
                    this.canvasContext.strokeStyle = "lightgray";
                    this.canvasContext.fillRect(rectX, activityRow, rectWidth, ROW_HEIGHT);

                    //TODO: Limit height of the text to 2 rows when it's placed outside the activity rectangle and include that in the activityRow calculation
                    this.canvasContext.fillStyle = activity.textColor;
                    this.canvasContext.strokeStyle = 'none';
                    this.canvasContext.fillText(activity.name, textStart, parseInt(activityRow, 10) + TEXT_PADDING);
                }
            });
        }
    }
};
</script>
