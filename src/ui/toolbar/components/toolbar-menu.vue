<template>
<div class="c-ctrl-wrapper">
    <div
        class="c-icon-button c-icon-button--menu"
        :class="options.icon"
        :title="options.title"
        @click="toggle"
    >
        <div
            v-if="options.label"
            class="c-icon-button__label"
        >
            {{ options.label }}
        </div>
    </div>
    <div
        v-if="open"
        class="c-menu"
    >
        <ul>
            <li
                v-for="(option, index) in options.options"
                :key="index"
                :class="option.class"
                @click="onClick(option)"
            >
                {{ option.name }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import toggle from '../../mixins/toggle-mixin';
export default {
    mixins: [toggle],
    props: {
        options: {
            type: Object,
            required: true,
            validator(value) {
                // must pass valid options array.
                return Array.isArray(value.options)
                    && value.options.every((o) => o.name);
            }
        }
    },
    methods: {
        onClick(option) {
            this.$emit('click', option);
        }
    }
};
</script>
