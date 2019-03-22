<template>
    <div class="c-ctrl-wrapper">
        <div class="c-icon-button c-icon-button--menu"
             :class="[options.icon, {'c-click-icon--mixed': nonSpecific}]"
             :title="options.title"
             @click="toggle">
            <div class="c-button__label">{{ selectedName }}</div>
        </div>
        <div class="c-menu" v-if="open">
            <ul>
                <li v-for="option in options.options"
                    :key="option.value"
                    @click="select(option)">
                    {{ option.name || option.value }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import toggleMixin from '../../mixins/toggle-mixin';

export default {
    mixins: [toggleMixin],
    props: {
        options: {
            type: Object,
            validator(value) {
                // must pass valid options array.
                return Array.isArray(value.options) &&
                    value.options.every((o) => o.value);
            }
        }
    },
    methods: {
        select(option) {
            if (this.options.value === option.value) {
                return;
            }
            this.$emit('change', option.value, this.options);
        }
    },
    computed: {
        selectedName() {
            let selectedOption = this.options.options.filter((o) => o.value === this.options.value)[0];
            if (selectedOption) {
                return selectedOption.name || selectedOption.value
            }
            // If no selected option, then options are non-specific
            return '??px';
        },
        nonSpecific() {
            return this.options.nonSpecific === true;
        }
    }
}
</script>
