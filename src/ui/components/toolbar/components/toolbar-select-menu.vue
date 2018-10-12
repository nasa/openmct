<template>
    <div class="c-ctrl-wrapper">
        <div class="c-click-icon c-click-icon--menu"
             :class="options.icon"
             @click="toggle">
            <div class="c-button__label">{{ selectedName }}</div>
        </div>
        <div class="c-menu" v-if="open">
            <ul>
                <li v-for="option in options.options"
                    :key="option.value"
                    @click="select(option)">
                    {{ option.name }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import toggleMixin from './toggle-mixin';

export default {
    mixins: [toggleMixin],
    props: {
        options: {
            type: Object,
            validator(value) {
                // must pass valid options array.
                return Array.isArray(value.options) &&
                    value.options.every((o) => o.value && o.name);
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
    data() {
    },
    computed: {
        selectedName() {
            let selectedOption = this.options.options.filter((o) => o.value === this.options.value)[0];
            if (selectedOption) {
                return selectedOption.name
            }
            return '';
        }
    }
}
</script>
