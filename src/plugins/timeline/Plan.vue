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
    props: {
        drawingEngine: {
            type: String,
            default: 'canvas'
        }
    },
    mounted() {
        this.activityPositions = {};
        this.viewBounds = this.openmct.time.bounds();
        this.xAxis = d3Axis.axisTop();

        this.container = d3Selection.select(this.$refs.axisHolder);
        this.svgElement = this.container.append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis");
        if (this.drawingEngine !== 'svg') {
            this.canvas = this.container.append('canvas').node();
            this.canvasContext = this.canvas.getContext('2d');
        } else {
            this.canvasContext = document.createElement('canvas').getContext('2d');
        }

        this.setDimensions();
        this.setScale();

        // setInterval(this.resize, RESIZE_POLL_INTERVAL);
        this.plotActivity();

    },
    methods: {
        setDimensions() {
            const axisHolder = this.$refs.axisHolder;
            const rect = axisHolder.getBoundingClientRect();
            this.left = Math.round(rect.left);
            this.top = Math.round(rect.top);
            this.height = Math.round(rect.height);
            this.width = axisHolder.clientWidth;
            if (this.drawingEngine !== 'svg') {
                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }
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
        getRowForActivity(rectX, rectWidth, defaultActivityRow) {
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

            return activityRow || defaultActivityRow;
        },
        plotActivity() {
            let currentStart;
            let currentEnd;
            let activityRow = this.drawingEngine === 'svg' ? this.top : 0;
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
                        activityRow = this.getRowForActivity(rectX, rectWidth, this.drawingEngine === 'svg' ? this.top : 0);
                    } else {
                        activityRow = this.getRowForActivity(rectX, (textStart + activityNameWidth), this.drawingEngine === 'svg' ? this.top : 0);
                    }

                    if (!this.activityPositions[activityRow]) {
                        this.activityPositions[activityRow] = [];
                    }

                    this.activityPositions[activityRow].push({
                        start: rectX,
                        end: canFitText ? rectWidth : textStart + activityNameWidth
                    });

                    //TODO: Limit height of the text to 2 rows when it's placed outside the activity rectangle and include that in the activityRow calculation
                    if (this.drawingEngine === 'svg') {
                        this.plotSVG(activity, rectX, rectWidth, activityRow, textStart);
                    } else {
                        this.plotCanvas(activity, rectX, rectWidth, activityRow, textStart);
                    }
                }
            });
        },
        plotSVG(activity, rectX, rectWidth, activityRow, textStart) {
            this.svgElement.append("rect")
                .attr("class", "activity")
                .attr("x", rectX)
                .attr("y", activityRow)
                .attr("width", rectWidth)
                .attr("height", ROW_HEIGHT)
                .attr('fill', activity.color)
                .attr('stroke', "lightgray");

            this.svgElement.append("text").text(activity.name)
                .attr("class", "activity")
                .attr("x", textStart)
                .attr("y", parseInt(activityRow, 10) + TEXT_PADDING)
                .attr('fill', activity.textColor);
        },
        plotCanvas(activity, rectX, rectWidth, activityRow, textStart) {
            this.canvasContext.fillStyle = activity.color;
            this.canvasContext.strokeStyle = "lightgray";
            this.canvasContext.fillRect(rectX, activityRow, rectWidth, ROW_HEIGHT);
            this.canvasContext.strokeRect(rectX, activityRow, rectWidth, ROW_HEIGHT);

            this.canvasContext.fillStyle = activity.textColor;
            this.canvasContext.fillText(activity.name, textStart, parseInt(activityRow, 10) + TEXT_PADDING);
        }
    }
};
</script>
