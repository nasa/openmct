<template>
    <div class="c-ctrl-wrapper">
        <div class="c-icon-button c-icon-button--menu"
             :class="options.icon"
             :title="options.title"
             @click="toggle">
            <div class="c-icon-button__label"
                 v-if="options.label">
                {{ options.label }}
            </div>
        </div>
        <div class="c-menu" v-if="open">
            <ul>
                <li v-for="option in options.options"
                    @click="onClick(option)"
                    :class="option.class">
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
            validator(value) {
                // must pass valid options array.
                return Array.isArray(value.options) &&
                    value.options.every((o) => o.name);
            }
        }
    },
    methods: {
        onClick(option) {
            this.$emit('click', option)
        }
    }
}
</script>
