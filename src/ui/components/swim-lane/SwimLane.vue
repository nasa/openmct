<template>
<div class="u-contents"
     :class="{'c-swim-lane': showParentClass}"
>

    <div v-if="!hideLabel"
         class="c-swim-lane__lane-label c-swim-lane__lane-label--span-cols c-object-label"
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
        showParentClass: {
            type: Boolean,
            default() {
                return true;
            }
        },
        hideLabel: {
            type: Boolean,
            default() {
                return false;
            }
        }
    }
};
</script>
