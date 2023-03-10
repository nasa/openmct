<template>
<swim-lane
    :is-nested="isNested"
    :status="status"
>
    <template slot="label">
        {{ heading }}
    </template>
    <template slot="object">
        <svg
            :height="height"
            :width="width"
            :viewBox="'0 0 ' + width + ' ' + height"
        >
            <template v-for="(activity, index) in activities">
                <template v-if="clipActivityNames === true">
                    <clipPath
                        :id="getClipId(activity, index)"
                        :key="`clipPath-${index}`"
                    >
                        <rect
                            :x="activity.rectStart"
                            :y="activity.row"
                            :width="activity.rectWidth"
                            :height="25"
                        />
                    </clipPath>
                </template>
                <g
                    :key="`g-${index}`"
                    @click="setSelectionForActivity(activity, $event)"
                >
                    <rect
                        :key="`rect-${index}`"
                        :x="activity.rectStart"
                        :y="activity.row"
                        :width="activity.rectWidth"
                        :height="25"
                        :class="activity.class"
                        :fill="activity.color"
                    />
                    <text
                        v-for="(textLine, textIndex) in activity.textLines"
                        :key="`text-${index}-${textIndex}`"
                        :class="`activity-label ${activity.textClass}`"
                        :x="activity.textStart"
                        :y="activity.textY + (textIndex * lineHeight)"
                        :fill="activity.textColor"
                        :clip-path="clipActivityNames === true ? `url(#${getClipId(activity, index)})` : ''"
                    >
                        {{ textLine }}
                    </text>
                </g>
            </template>
            <text
                v-if="activities.length === 0"
                x="10"
                y="20"
                class="activity-label--outside-rect"
            >
                No activities within timeframe
            </text>
        </svg>
    </template>
</swim-lane>
</template>

<script>
import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

export default {
    components: {
        SwimLane
    },
    inject: ['openmct', 'domainObject'],
    props: {
        activities: {
            type: Array,
            required: true
        },
        clipActivityNames: {
            type: Boolean,
            default: false
        },
        heading: {
            type: String,
            required: true
        },
        height: {
            type: Number,
            default: 30
        },
        width: {
            type: Number,
            default: 200
        },
        isNested: {
            type: Boolean,
            default: false
        },
        status: {
            type: String,
            default() {
                return '';
            }
        }
    },
    computed: {
        lineHeight() {
            return 12;
        }
    },
    methods: {
        getClipId(activity, index) {
            const activityName = activity.name.toLowerCase().replace(/ /g, '-');

            return `clipPath-${activityName}-${index}`;
        },
        setSelectionForActivity(activity, event) {
            const element = event.currentTarget;
            const multiSelect = event.metaKey;

            event.stopPropagation();

            this.openmct.selection.select([{
                element: element,
                context: {
                    type: 'activity',
                    activity: activity
                }
            }, {
                element: this.openmct.layout.$refs.browseObject.$el,
                context: {
                    item: this.domainObject,
                    supportsMultiSelect: true
                }
            }], multiSelect);
        }
    }
};
</script>
