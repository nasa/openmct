<template>
<div class="u-contents"
     :class="{'c-swim-lane': !isNested}"
>

    <div class="c-swim-lane__lane-label c-object-label"
         :class="{'c-swim-lane__lane-label--span-rows': spanRows, 'c-swim-lane__lane-label--span-cols': (!spanRows && !isNested)}"
    >
        <div v-if="iconClass"
             class="c-object-label__type-icon"
             :class="iconClass"
        >
        </div>

        <div class="c-object-label__name">
            <slot name="label"></slot>
        </div>

    </div>
    <div class="c-swim-lane__lane-object"
         :style="{'min-height': minHeight}"
         :class="{'u-contents': showUcontents}"
         data-selectable
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
        isNested: {
            type: Boolean,
            default() {
                return false;
            }
        },
        spanRows: {
            type: Boolean,
            default() {
                return false;
            }
        }
    }
};
</script>
