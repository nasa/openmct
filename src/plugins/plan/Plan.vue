<template>
<div ref="plan"
     class="c-plan"
>
    <div v-if="viewBounds && !options.compact"
         class="c-plan-content u-contents"
    >
        <div class="c-plan-content__lane-label"
             :class="{'c-plan-content__lane-label--span-cols': true}"
        >
            {{ timeSystem.name }}
        </div>
        <timeline-axis
            class="c-plan-content__lane-object"
            :bounds="viewBounds"
            :time-system="timeSystem"
            :content-height="height"
            :rendering-engine="renderingEngine"
        />
    </div>
    <div ref="planHolder"
         class="c-plan-content u-contents"
    ></div>
</div>
</template>

<script>
import * as d3Selection from 'd3-selection';
import * as d3Scale from 'd3-scale';
import TimelineAxis from "../../ui/components/TimeSystemAxis.vue";

//TODO: UI direction needed for the following property values
const PADDING = 1;
const OUTER_TEXT_PADDING = 12;
const INNER_TEXT_PADDING = 17;
const TEXT_LEFT_PADDING = 5;
const ROW_PADDING = 12;
const RESIZE_POLL_INTERVAL = 200;
const ROW_HEIGHT = 30;
const LINE_HEIGHT = 12;
const MAX_TEXT_WIDTH = 300;

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        TimelineAxis
    },
    props: {
        options: {
            type: Object,
            default() {
                return {
                    compact: false
                };
            }
        },
        renderingEngine: {
            type: String,
            default() {
                return 'svg';
            }
        }
    },
    data() {
        return {
            viewBounds: undefined,
            timeSystem: undefined,
            height: 0
        };
    },
    mounted() {
        this.validateJSON(this.domainObject.selectFile.body);

        this.container = d3Selection.select(this.$refs.planHolder);

        this.canvas = this.$refs.plan.appendChild(document.createElement('canvas'));
        this.canvas.height = 0;
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
            let clientWidth = this.$refs.planHolder.clientWidth;
            if (this.options.clientWidth !== undefined) {
                clientWidth = this.options.clientWidth;
            }

            if (clientWidth !== this.width) {
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
            if (this.timeSystem === undefined) {
                this.timeSystem = this.openmct.time.timeSystem();
            }

            this.setScaleAndPlotActivities();
        },
        setScaleAndPlotActivities(timeSystem) {
            if (timeSystem !== undefined) {
                this.timeSystem = timeSystem;
            }

            this.setScale(this.timeSystem);
            this.clearPreviousActivities();
            if (this.xScale) {
                this.calculatePlanLayout();
                this.drawPlan();
            }
        },
        clearPreviousActivities() {
            d3Selection.selectAll(".c-plan-content__lane-label").remove();
            d3Selection.selectAll(".c-plan-content__lane-object").remove();
        },
        setDimensions() {
            const planHolder = this.$refs.planHolder;
            const rect = planHolder.getBoundingClientRect();
            this.left = Math.round(rect.left);
            this.top = Math.round(rect.top);
            if (this.options.clientWidth !== undefined) {
                this.width = this.options.clientWidth;
            } else {
                this.width = planHolder.clientWidth;
            }

            this.height = Math.round(planHolder.getBoundingClientRect().height);
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
        },
        isActivityInBounds(activity) {
            return (activity.start < this.viewBounds.end) && (activity.end > this.viewBounds.start);
        },
        getTextWidth(name) {
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
        getRowForActivity(rectX, width, activitiesByRow) {
            let currentRow;
            let sortedActivityRows = Object.keys(activitiesByRow).sort(this.sortFn);

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
                if (getOverlap(activitiesByRow[row])) {
                    currentRow = row;
                    break;
                }
            }

            if (currentRow === undefined && sortedActivityRows.length) {
                let row = parseInt(sortedActivityRows[sortedActivityRows.length - 1], 10);
                currentRow = row + ROW_HEIGHT + ROW_PADDING;
            }

            return (currentRow || 0);
        },
        calculatePlanLayout() {
            let groups = Object.keys(this.json);
            this.groupActivities = {};

            groups.forEach((key, index) => {
                let activitiesByRow = {};
                let currentRow = 0;

                let activities = this.json[key];
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
                            currentRow = this.getRowForActivity(rectX, rectWidth, activitiesByRow);
                        } else {
                            currentRow = this.getRowForActivity(rectX, textWidth, activitiesByRow);
                        }

                        let textY = parseInt(currentRow, 10) + (activityNameFitsRect ? INNER_TEXT_PADDING : OUTER_TEXT_PADDING);

                        if (!activitiesByRow[currentRow]) {
                            activitiesByRow[currentRow] = [];
                        }

                        activitiesByRow[currentRow].push({
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
                    }
                });
                this.groupActivities[key] = {
                    heading: key,
                    activitiesByRow
                };
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
        getGroupContainer(activityRows, heading) {
            let groupLabel = this.container.append('div');
            groupLabel.attr("class", "c-plan-content__lane-label c-plan-content__lane-label--span-cols");
            groupLabel.html(heading);

            const rows = Object.keys(activityRows);
            const lastActivityRow = rows[rows.length - 1];
            const svgHeight = parseInt(lastActivityRow, 10) + ROW_HEIGHT;
            let groupSVGContainer = this.container.append('div');
            groupSVGContainer.attr("class", "c-plan-content__lane-object");
            let groupSVG = groupSVGContainer.append('svg');
            groupSVG.attr("height", svgHeight);
            if (this.options.clientWidth !== undefined) {
                groupSVG.attr("width", this.width - groupLabel.node().getBoundingClientRect().width);
            } else {
                groupSVG.attr("width", this.width);
            }

            return {
                groupLabel,
                groupSVG
            };
        },
        drawPlan() {

            Object.keys(this.groupActivities).forEach((group, index) => {
                const activitiesByRow = this.groupActivities[group].activitiesByRow;
                const heading = this.groupActivities[group].heading;
                const groupElements = this.getGroupContainer(activitiesByRow, heading);
                let groupSVG = groupElements.groupSVG;

                Object.keys(activitiesByRow).forEach((row) => {
                    const items = activitiesByRow[row];
                    items.forEach(item => {
                    //TODO: Don't draw the left-border of the rectangle if the activity started before viewBounds.start
                        this.plotSVG(item, parseInt(row, 10), groupSVG);
                    });
                });

            });
        },
        plotSVG(item, row, svgElement) {
            const activity = item.activity;
            svgElement.append("rect")
                .attr("class", "activity")
                .attr("x", item.start)
                .attr("y", row)
                .attr("width", item.rectWidth)
                .attr("height", ROW_HEIGHT)
                .attr('fill', activity.color)
                .attr('stroke', "lightgray");

            item.textLines.forEach((line, index) => {
                svgElement.append("text").text(line)
                    .attr("class", "activity")
                    .attr("x", item.textStart)
                    .attr("y", item.textY + (index * LINE_HEIGHT))
                    .attr('fill', activity.textColor);
            });
        }
    }
};
</script>
