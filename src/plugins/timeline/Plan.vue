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

//TODO: UI direction needed for the following property values
const PADDING = 1;
const TEXT_PADDING = 12;
const INNER_TEXT_PADDING = 17;
const TEXT_LEFT_PADDING = 5;
const ROW_PADDING = 12;
// const DEFAULT_DURATION_FORMATTER = 'duration';
// const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;
const ROW_HEIGHT = 30;
const LINE_HEIGHT = 12;
const MAX_TEXT_WIDTH = 300;

export default {
    inject: ['openmct', 'domainObject'],
    mounted() {
        this.container = d3Selection.select(this.$refs.axisHolder);
        this.svgElement = this.container.append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis");
        this.setDimensions();
        this.canvas = this.container.append('canvas').node();
        this.canvasContext = this.canvas.getContext('2d');
        this.canvasContext.font = "normal 14px sans-serif";
        // this.canvas.width = this.width;
        // this.canvas.height = this.height;
        this.svgElement.attr("width", this.width);
        this.svgElement.attr("height", this.height);

        this.updateViewBounds();
        this.openmct.time.on("timeSystem", this.setScaleAndPlotActivities);
        this.openmct.time.on("bounds", this.updateViewBounds);

    },
    methods: {
        updateViewBounds() {
            this.viewBounds = this.openmct.time.bounds();
            this.xAxis = d3Axis.axisTop();
            this.setScaleAndPlotActivities();
        },
        setScaleAndPlotActivities() {
            this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            d3Selection.selectAll("svg > *").remove();
            this.setScale();
            this.plotActivity();
        },
        setDimensions() {
            const axisHolder = this.$refs.axisHolder;
            const rect = axisHolder.getBoundingClientRect();
            this.left = Math.round(rect.left);
            this.top = Math.round(rect.top);
            this.width = axisHolder.clientWidth;
            const axisHolderParent = this.$parent.$refs.planHolder;
            this.height = Math.round(axisHolderParent.getBoundingClientRect().height);
        },
        setScale(timeSystem) {
            if (!this.width) {
                return;
            }

            if (timeSystem === undefined) {
                timeSystem = this.openmct.time.timeSystem();
            }

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
        sortFn(a, b) {
            const numA = parseInt(a, 10);
            const numB = parseInt(b, 10);
            if (numA > numB) {
                return 1;
            }

            if (numA < numB) {
                return -1;
            }

            return 0;
        },
        // Get the row where the next activity will land.
        getRowForActivity(rectX, rectWidth, defaultActivityRow = 0) {
            let activityRow;
            let sortedActivityRows = Object.keys(this.activityPositions).sort(this.sortFn);

            function getOverlap(rects) {
                return rects.every(rect => {
                    const { start, end } = rect;
                    const hasOverlap = (rectX >= start && rectX <= end) || (rectWidth >= start && rectWidth <= end) || (rectX <= start && rectWidth >= end);

                    return !hasOverlap;
                });
            }

            for (let i = 0; i < sortedActivityRows.length; i++) {
                let row = sortedActivityRows[i];
                if (getOverlap(this.activityPositions[row])) {
                    activityRow = row;
                    break;
                }
            }

            if (activityRow === undefined && sortedActivityRows.length) {
                activityRow = parseInt(sortedActivityRows[sortedActivityRows.length - 1], 10) + ROW_HEIGHT + ROW_PADDING;
            }

            return (activityRow || defaultActivityRow);
        },
        plotActivity() {
            let currentStart;
            let currentEnd;
            let activityRow = 0;
            this.activityPositions = {};
            this.domainObject.configuration.activities.forEach((activity) => {
                if (this.isActivityInBounds(activity)) {
                    currentStart = Math.max(this.viewBounds.start, activity.start);
                    currentEnd = Math.min(this.viewBounds.end, activity.end);
                    const rectX = this.xScale(currentStart);
                    const rectY = this.xScale(currentEnd);
                    const rectWidth = rectY - rectX;

                    const activityNameWidth = this.getTextWidth(activity.name) + TEXT_LEFT_PADDING;

                    const innerLabelStart = rectX + TEXT_LEFT_PADDING;
                    // const innerLabelEnd = innerLabelStart + activityNameWidth;
                    const outerLabelStart = rectX + rectWidth + TEXT_LEFT_PADDING;

                    const canFitText = (rectWidth >= activityNameWidth);

                    const textStart = canFitText ? innerLabelStart : outerLabelStart;
                    const textWidth = textStart + activityNameWidth;

                    if (canFitText) {
                        activityRow = this.getRowForActivity(rectX, rectWidth);
                    } else {
                        activityRow = this.getRowForActivity(rectX, textWidth);
                    }

                    //TODO: Don't draw the left-border of the rectangle if the activity started before viewBounds.start
                    // this.plotCanvas(activity, rectX, rectWidth, activityRow, textStart, canFitText);
                    this.plotSVG(activity, rectX, rectWidth, activityRow, textStart, canFitText);

                    if (!this.activityPositions[activityRow]) {
                        this.activityPositions[activityRow] = [];
                    }

                    this.activityPositions[activityRow].push({
                        start: rectX,
                        end: canFitText ? rectWidth : textWidth
                    });
                }
            });
        },
        plotSVG(activity, rectX, rectWidth, activityRow, textStart, canFitText) {
            this.svgElement.append("rect")
                .attr("class", "activity")
                .attr("x", rectX)
                .attr("y", activityRow)
                .attr("width", rectWidth)
                .attr("height", ROW_HEIGHT)
                .attr('fill', activity.color)
                .attr('stroke', "lightgray");

            let textLines = this.getActivityText(this.canvasContext, activity.name, canFitText);
            let y = canFitText ? parseInt(activityRow, 10) + INNER_TEXT_PADDING : parseInt(activityRow, 10) + TEXT_PADDING;
            textLines.forEach((line, index) => {
              this.svgElement.append("text").text(line)
                  .attr("class", "activity")
                  .attr("x", textStart)
                  .attr("y", y + (index * LINE_HEIGHT))
                  .attr('fill', activity.textColor);
            });
        },
        plotCanvas(activity, rectX, rectWidth, activityRow, textStart, canFitText) {
            this.canvasContext.fillStyle = activity.color;
            this.canvasContext.strokeStyle = "lightgray";
            this.canvasContext.fillRect(rectX, activityRow, rectWidth, ROW_HEIGHT);
            this.canvasContext.strokeRect(rectX, activityRow, rectWidth, ROW_HEIGHT);

            this.canvasContext.fillStyle = activity.textColor;

            let y = canFitText ? parseInt(activityRow, 10) + INNER_TEXT_PADDING : parseInt(activityRow, 10) + TEXT_PADDING;
            let textLines = this.getActivityText(this.canvasContext, activity.name, canFitText);

            textLines.forEach((line, index) => {
              this.canvasContext.fillText(line, textStart, y + (index * LINE_HEIGHT));
            });
        },
        getActivityText(context, text, canFitText) {
          //TODO: If the activity start is less than viewBounds.start then the text should be cropped on the left/should be off-screen)
          let words = text.split(' ');
          let line = '';
          let activityText = [];
          let rows = 1;

          for (let n = 0; (n < words.length) && (rows <= 2); n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            if (!canFitText && (testWidth > MAX_TEXT_WIDTH && n > 0)) {
              activityText.push(line);
              line = words[n] + ' ';
              testLine = line + words[n] + ' ';
              rows = rows + 1;
            }
            line = testLine;
          }

          return activityText.length ? activityText : [line];
        }
    }
};
</script>
