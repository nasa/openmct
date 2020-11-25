<template>
<div ref="axisHolder"
     class="c-timeline-plan"
>
    <div class="nowMarker"><span class="icon-arrow-down"></span></div>
</div>
</template>

<script>
import * as d3Selection from 'd3-selection';
import * as d3Axis from 'd3-axis';
import * as d3Scale from 'd3-scale';
import utcMultiTimeFormat from "@/plugins/timeConductor/utcMultiTimeFormat";

//TODO: UI direction needed for the following property values
const PADDING = 1;
const OUTER_TEXT_PADDING = 12;
const INNER_TEXT_PADDING = 17;
const TEXT_LEFT_PADDING = 5;
const ROW_PADDING = 12;
// const DEFAULT_DURATION_FORMATTER = 'duration';
const RESIZE_POLL_INTERVAL = 200;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;
const ROW_HEIGHT = 30;
const LINE_HEIGHT = 12;
const MAX_TEXT_WIDTH = 300;
const TIMELINE_HEIGHT = 30;
//This offset needs to be re-considered
const TIMELINE_OFFSET_HEIGHT = 70;
const GROUP_OFFSET = 100;

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        "renderingEngine": {
            type: String,
            default() {
                return 'canvas';
            }
        }
    },
    mounted() {
        this.validateJSON(this.domainObject.selectFile.body);
        if (this.renderingEngine === 'svg') {
            this.useSVG = true;
        }

        this.container = d3Selection.select(this.$refs.axisHolder);
        this.svgElement = this.container.append("svg:svg");
        // draw x axis with labels. CSS is used to position them.
        this.axisElement = this.svgElement.append("g")
            .attr("class", "axis");
        this.xAxis = d3Axis.axisTop();

        this.canvas = this.container.append('canvas').node();
        this.canvasContext = this.canvas.getContext('2d');

        this.setDimensions();
        this.updateViewBounds();
        this.openmct.time.on("timeSystem", this.setScaleAndPlotActivities);
        this.openmct.time.on("bounds", this.updateViewBounds);
        this.resizeTimer = setInterval(this.resize, RESIZE_POLL_INTERVAL);
        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);
    },
    destroyed() {
        clearInterval(this.resizeTimer);
        this.openmct.time.off("timeSystem", this.setScaleAndPlotActivities);
        this.openmct.time.off("bounds", this.updateViewBounds);
        if (this.unlisten) {
            this.unlisten();
        }
    },
    methods: {
        observeForChanges(mutatedObject) {
            this.validateJSON(mutatedObject.selectFile.body);
            this.setScaleAndPlotActivities();
        },
        resize() {
            if (this.$refs.axisHolder.clientWidth !== this.width) {
                this.setDimensions();
                this.updateViewBounds();
            }
        },
        validateJSON(jsonString) {
            try {
                this.json = JSON.parse(jsonString);
            } catch (e) {
                return false;
            }

            return true;
        },
        updateViewBounds() {
            this.viewBounds = this.openmct.time.bounds();
            // this.viewBounds.end = this.viewBounds.end + (30 * 60 * 1000);
            this.setScaleAndPlotActivities();
        },
        updateNowMarker() {
            if (this.openmct.time.clock() === undefined) {
                let nowMarker = document.querySelector('.nowMarker');
                if (nowMarker) {
                    nowMarker.parentNode.removeChild(nowMarker);
                }
            } else {
                let nowMarker = document.querySelector('.nowMarker');
                if (nowMarker) {
                    const svgEl = d3Selection.select(this.svgElement).node();
                    const height = this.useSVG ? svgEl.style('height') : this.canvas.height + 'px';
                    nowMarker.style.height = height;
                    const now = this.xScale(Date.now());
                    nowMarker.style.left = now + GROUP_OFFSET + 'px';
                }
            }
        },
        setScaleAndPlotActivities() {
            this.setScale();
            this.clearPreviousActivities();
            if (this.xScale) {
                this.calculatePlanLayout();
                this.drawPlan();
                this.updateNowMarker();
            }
        },
        clearPreviousActivities() {
            if (this.useSVG) {
                d3Selection.selectAll("svg > :not(g)").remove();
            } else {
                this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        },
        setDimensions() {
            const axisHolder = this.$refs.axisHolder;
            const rect = axisHolder.getBoundingClientRect();
            this.left = Math.round(rect.left);
            this.top = Math.round(rect.top);
            this.width = axisHolder.clientWidth;
            this.offsetWidth = this.width - GROUP_OFFSET;

            const axisHolderParent = this.$parent.$refs.planHolder;
            this.height = Math.round(axisHolderParent.getBoundingClientRect().height);

            if (this.useSVG) {
                this.svgElement.attr("width", this.width);
                this.svgElement.attr("height", this.height);
            } else {
                this.svgElement.attr("height", 50);
                this.canvas.width = this.width;
                this.canvas.height = this.height;
            }

            this.canvasContext.font = "normal normal 12px sans-serif";
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

            this.xScale.range([PADDING, this.offsetWidth - PADDING * 2]);

            this.xAxis.scale(this.xScale);
            this.xAxis.tickFormat(utcMultiTimeFormat);

            this.axisElement.call(this.xAxis);

            if (this.width > 1800) {
                this.xAxis.ticks(this.offsetWidth / PIXELS_PER_TICK_WIDE);
            } else {
                this.xAxis.ticks(this.offsetWidth / PIXELS_PER_TICK);
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
        getRowForActivity(rectX, width, minimumActivityRow = 0) {
            let currentRow;
            let sortedActivityRows = Object.keys(this.activitiesByRow).sort(this.sortFn);

            function getOverlap(rects) {
                return rects.every(rect => {
                    const { start, end } = rect;
                    const calculatedEnd = rectX + width;
                    const hasOverlap = (rectX >= start && rectX <= end) || (calculatedEnd >= start && calculatedEnd <= end) || (rectX <= start && calculatedEnd >= end);

                    return !hasOverlap;
                });
            }

            for (let i = 0; i < sortedActivityRows.length; i++) {
                let row = sortedActivityRows[i];
                if (row >= minimumActivityRow && getOverlap(this.activitiesByRow[row])) {
                    currentRow = row;
                    break;
                }
            }

            if (currentRow === undefined && sortedActivityRows.length) {
                let row = Math.max(parseInt(sortedActivityRows[sortedActivityRows.length - 1], 10), minimumActivityRow);
                currentRow = row + ROW_HEIGHT + ROW_PADDING;
            }

            return (currentRow || minimumActivityRow);
        },
        calculatePlanLayout() {
            this.activitiesByRow = {};

            let currentRow = 0;

            let groups = Object.keys(this.json);
            groups.forEach((key, index) => {
                let activities = this.json[key];
                //set the new group's first row. It should be greater than the largest row of the last group
                let sortedActivityRows = Object.keys(this.activitiesByRow).sort(this.sortFn);
                const groupRowStart = sortedActivityRows.length ? parseInt(sortedActivityRows[sortedActivityRows.length - 1], 10) + 1 : 0;
                let newGroup = true;
                activities.forEach((activity) => {
                    if (this.isActivityInBounds(activity)) {
                        const currentStart = Math.max(this.viewBounds.start, activity.start);
                        const currentEnd = Math.min(this.viewBounds.end, activity.end);
                        const rectX = this.xScale(currentStart);
                        const rectY = this.xScale(currentEnd);
                        const rectWidth = rectY - rectX;

                        const activityNameWidth = this.getTextWidth(activity.name) + TEXT_LEFT_PADDING;
                        //TODO: Fix bug for SVG where the rectWidth is not proportional to the canvas measuredWidth of the text
                        const activityNameFitsRect = (rectWidth >= activityNameWidth);
                        const textStart = (activityNameFitsRect ? rectX : (rectX + rectWidth)) + TEXT_LEFT_PADDING;

                        let textLines = this.getActivityDisplayText(this.canvasContext, activity.name, activityNameFitsRect);
                        const textWidth = textStart + this.getTextWidth(textLines[0]) + TEXT_LEFT_PADDING;

                        if (activityNameFitsRect) {
                            currentRow = this.getRowForActivity(rectX, rectWidth, groupRowStart);
                        } else {
                            currentRow = this.getRowForActivity(rectX, textWidth, groupRowStart);
                        }

                        let textY = parseInt(currentRow, 10) + (activityNameFitsRect ? INNER_TEXT_PADDING : OUTER_TEXT_PADDING);

                        if (!this.activitiesByRow[currentRow]) {
                            this.activitiesByRow[currentRow] = [];
                        }

                        this.activitiesByRow[currentRow].push({
                            heading: newGroup ? key : '',
                            activity: {
                                color: activity.color,
                                textColor: activity.textColor
                            },
                            textLines: textLines,
                            textStart: textStart,
                            textY: textY,
                            start: rectX,
                            end: activityNameFitsRect ? rectX + rectWidth : textStart + textWidth,
                            rectWidth: rectWidth
                        });
                        newGroup = false;
                    }
                });
            });
        },
        getActivityDisplayText(context, text, activityNameFitsRect) {
        //TODO: If the activity start is less than viewBounds.start then the text should be cropped on the left/should be off-screen)
            let words = text.split(' ');
            let line = '';
            let activityText = [];
            let rows = 1;

            for (let n = 0; (n < words.length) && (rows <= 2); n++) {
                let testLine = line + words[n] + ' ';
                let metrics = context.measureText(testLine);
                let testWidth = metrics.width;
                if (!activityNameFitsRect && (testWidth > MAX_TEXT_WIDTH && n > 0)) {
                    activityText.push(line);
                    line = words[n] + ' ';
                    testLine = line + words[n] + ' ';
                    rows = rows + 1;
                }

                line = testLine;
            }

            return activityText.length ? activityText : [line];
        },
        getGroupHeading(row) {
            let groupHeadingRow;
            let groupHeadingBorder;

            if (row) {
                groupHeadingBorder = row + ROW_PADDING + OUTER_TEXT_PADDING;
                groupHeadingRow = groupHeadingBorder + OUTER_TEXT_PADDING;
            } else {
                groupHeadingRow = TIMELINE_HEIGHT + OUTER_TEXT_PADDING;
            }

            return {
                groupHeadingRow,
                groupHeadingBorder
            };
        },
        getPlanHeight(activityRows) {
            return parseInt(activityRows[activityRows.length - 1], 10) + TIMELINE_OFFSET_HEIGHT;
        },
        drawPlan() {
            const activityRows = Object.keys(this.activitiesByRow);
            if (activityRows.length) {

                let planHeight = this.getPlanHeight(activityRows);
                planHeight = Math.max(this.height, planHeight);
                if (this.useSVG) {
                    this.svgElement.attr("height", planHeight);
                } else {
                    // This needs to happen before we draw on the canvas or the canvas will get wiped out when height is set
                    this.canvas.height = planHeight;
                }

                activityRows.forEach((key) => {
                    const items = this.activitiesByRow[key];
                    const row = parseInt(key, 10);
                    items.forEach((item) => {

                        //TODO: Don't draw the left-border of the rectangle if the activity started before viewBounds.start
                        if (this.useSVG) {
                            this.plotSVG(item, row);
                        } else {
                            this.plotCanvas(item, row);
                        }

                    });

                });
            }
        },
        plotSVG(item, row) {
            const headingText = item.heading;
            const { groupHeadingRow, groupHeadingBorder } = this.getGroupHeading(row);

            if (headingText) {
                if (groupHeadingBorder) {
                    this.svgElement.append("line")
                        .attr("class", "activity")
                        .attr("x1", 0)
                        .attr("y1", groupHeadingBorder)
                        .attr("x2", this.width)
                        .attr("y2", groupHeadingBorder)
                        .attr('stroke', "white");
                }

                this.svgElement.append("text").text(headingText)
                    .attr("class", "activity")
                    .attr("x", 0)
                    .attr("y", groupHeadingRow)
                    .attr('fill', "white");
            }

            const activity = item.activity;
            const rectY = row + TIMELINE_HEIGHT;
            this.svgElement.append("rect")
                .attr("class", "activity")
                .attr("x", item.start + GROUP_OFFSET)
                .attr("y", rectY + TIMELINE_HEIGHT)
                .attr("width", item.rectWidth)
                .attr("height", ROW_HEIGHT)
                .attr('fill', activity.color)
                .attr('stroke', "lightgray");

            item.textLines.forEach((line, index) => {
                this.svgElement.append("text").text(line)
                    .attr("class", "activity")
                    .attr("x", item.textStart + GROUP_OFFSET)
                    .attr("y", item.textY + TIMELINE_HEIGHT + (index * LINE_HEIGHT))
                    .attr('fill', activity.textColor);
            });
            //TODO: Ending border
        },
        plotCanvas(item, row) {
            const headingText = item.heading;
            const { groupHeadingRow, groupHeadingBorder } = this.getGroupHeading(row);

            if (headingText) {
                if (groupHeadingBorder) {
                    this.canvasContext.strokeStyle = "white";
                    this.canvasContext.beginPath();
                    this.canvasContext.moveTo(0, groupHeadingBorder);
                    this.canvasContext.lineTo(this.width, groupHeadingBorder);
                    this.canvasContext.stroke();
                }

                this.canvasContext.fillStyle = "white";
                this.canvasContext.fillText(headingText, 0, groupHeadingRow);
            }

            const activity = item.activity;
            const rectX = item.start;
            const rectY = row + TIMELINE_HEIGHT;
            const rectWidth = item.rectWidth;
            this.canvasContext.fillStyle = activity.color;
            this.canvasContext.strokeStyle = "lightgray";
            this.canvasContext.fillRect(rectX + GROUP_OFFSET, rectY, rectWidth, ROW_HEIGHT);
            this.canvasContext.strokeRect(rectX + GROUP_OFFSET, rectY, rectWidth, ROW_HEIGHT);

            this.canvasContext.fillStyle = activity.textColor;

            item.textLines.forEach((line, index) => {
                this.canvasContext.fillText(line, item.textStart + GROUP_OFFSET, item.textY + TIMELINE_HEIGHT + (index * LINE_HEIGHT));
            });
            //TODO: Ending border
        }
    }
};
</script>
