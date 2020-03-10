<template>
<div class="c-toggle-switch">
    <label class="c-toggle-switch__control">
        <input
            :id="id"
            type="checkbox"
            :checked="checked"
            @change="onUserSelect($event)"
        >
        <span class="c-toggle-switch__slider"></span>
    </label>
    <div
        v-if="label && label.length"
        class="c-toggle-switch__label"
    >
        {{ label }}
    </div>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-toggle-switch {
    $d: 12px;
    $m: 2px;
    $br: $d/1.5;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;

    &__control,
    &__label {
        flex: 0 0 auto;
    }

    &__control {
        cursor: pointer;
        overflow: hidden;
        display: block;
    }

    input {
        opacity: 0;
        width: 0;
        height: 0;

        &:checked {
            + .c-toggle-switch__slider {
                background: $colorKey; // TODO: make discrete theme constants for these colors
                &:before {
                    transform: translateX(100%);
                }
            }
        }
    }

    &__slider {
        // Sits within __switch
        background: $colorBtnBg; // TODO: make discrete theme constants for these colors
        border-radius: $br;
        display: inline-block;
        height: $d + ($m*2);
        position: relative;
        transform: translateY(2px); // TODO: get this to work without this kind of hack!
        width: $d*2 + $m*2;

        &:before {
            // Knob
            background: $colorBtnFg; // TODO: make discrete theme constants for these colors
            border-radius: floor($br * 0.8);
            box-shadow: rgba(black, 0.4) 0 0 2px;
            content: '';
            display: block;
            position: absolute;
            height: $d; width: $d;
            top: $m; left: $m; right: auto;
            transition: transform 100ms ease-in-out;
        }
    }

    &__label {
        margin-left: $interiorMarginSm;
        margin-right: $interiorMargin;
        white-space: nowrap;
    }
}

</style>

<script>

export default {
    inject: ['openmct'],
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: false,
            default: ''
        },
        checked: Boolean
    },
    methods: {
        onUserSelect(event) {
            this.$emit('change', event.target.checked);
        }
    }
}

</script>
