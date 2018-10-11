<template>
    <div class="c-ctrl-wrapper">
        <div class="c-click-icon c-click-icon--menu"
             :class="options.icon"
             @click="toggle">
            <div class="c-click-icon__label"
                 v-if="options.label">
                {{ options.label }}
            </div>
        </div>
        <div class="c-menu" v-if="open">
            <ul>
                <li v-for="option in options.options"
                    :class="option.class"
                    :title="option.title">
                    {{ option.name }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import toggle from './toggle-mixin';
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
    }
}
</script>
