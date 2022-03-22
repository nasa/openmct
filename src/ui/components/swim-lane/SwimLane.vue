<template>
<div
    class="u-contents"
    :class="[
        {'c-swimlane': !isNested},
        statusClass
    ]"
>

    <div
        v-if="hideLabel === false"
        class="c-swimlane__lane-label c-object-label"
        :class="[swimlaneClass, statusClass]"
        :style="gridRowSpan"
    >
        <div
            v-if="iconClass"
            class="c-object-label__type-icon"
            :class="iconClass"
        >
            <span
                v-if="status"
                class="is-status__indicator"
                :title="`This item is ${status}`"
            ></span>
        </div>

        <div class="c-object-label__name">
            <slot name="label"></slot>
        </div>

    </div>
    <div
        class="c-swimlane__lane-object"
        :style="{'min-height': minHeight}"
        :class="{'u-contents': showUcontents}"
    >
        <slot name="object"></slot>
    </div>
</div>

</template>

<script>
export default {
    props: {
        iconClass: {
            type: String,
            default() {
                return '';
            }
        },
        status: {
            type: String,
            default() {
                return '';
            }
        },
        minHeight: {
            type: String,
            default() {
                return '';
            }
        },
        showUcontents: {
            type: Boolean,
            default() {
                return false;
            }
        },
        hideLabel: {
            type: Boolean,
            default() {
                return false;
            }
        },
        isNested: {
            type: Boolean,
            default() {
                return false;
            }
        },
        spanRowsCount: {
            type: Number,
            default() {
                return 0;
            }
        }
    },
    computed: {
        gridRowSpan() {
            if (this.spanRowsCount) {
                return `grid-row: span ${this.spanRowsCount}`;
            } else {
                return '';
            }
        },

        swimlaneClass() {
            if (!this.spanRowsCount && !this.isNested) {
                return 'c-swimlane__lane-label--span-cols';
            }

            return '';
        },

        statusClass() {
            return (this.status) ? `is-status--${this.status}` : '';
        }
    }
};
</script>
