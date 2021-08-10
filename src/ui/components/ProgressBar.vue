<template>
<div class="c-progress-bar">
    <div class="c-progress-bar__holder">
        <div
            class="c-progress-bar__bar"
            :class="{'--indeterminate': model.progressPerc === 'unknown'}"
            :style="styleBarWidth"
        ></div>
    </div>
    <div
        v-if="model.progressText !== undefined"
        class="c-progress-bar__text"
    >
        <span v-if="model.progressPerc > 0">{{ model.progressPerc }}% complete.</span>
        {{ model.progressText }}
    </div>
</div>
</template>

<script>
export default {
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    computed: {
        styleBarWidth() {
            return `width: ${this.model.progressPerc}%;`;
        }
    }
};
</script>
