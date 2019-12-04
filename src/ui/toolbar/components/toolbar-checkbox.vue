<template>
<div class="c-custom-checkbox">
    <input
        :id="uid"
        type="checkbox"
        :name="options.name"
        :checked="options.value"
        :disabled="options.disabled"
        @change="onChange"
    >

    <label :for="uid">
        <div class="c-custom-checkbox__box"></div>
        <div class="c-custom-checkbox__label-text">
            {{ options.name }}
        </div>
    </label>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-custom-checkbox {
        $d: 14px;
        display: flex;
        align-items: center;

        label {
            @include userSelectNone();
            display: flex;
            align-items: center;
        }

        &__box {
            @include nice-input();
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: $d;
            width: $d;
            height: $d;
            margin-right: $interiorMarginSm;
        }

        input {
            opacity: 0;
            position: absolute;

            &:checked + label > .c-custom-checkbox__box {
                background: $colorKey;
                &:before {
                    color: $colorKeyFg;
                    content: $glyph-icon-check;
                    font-family: symbolsfont;
                    font-size: 0.6em;
                }
            }

            &:not(:disabled) + label {
                cursor: pointer;
            }

            &:disabled + label {
                opacity: 0.5;
            }
        }
    }
</style>

<script>

let uniqueId = 100;

export default {
    props: {
        options: {
            type: Object,
            required: true
        }
    },
    data() {
        uniqueId++;
        return {
            uid: `mct-checkbox-id-${uniqueId}`
        };
    },
    methods: {
        onChange(event) {
            this.$emit('change', event.target.checked, {...this.options});
        }
    }
}
</script>
