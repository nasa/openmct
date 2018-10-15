<template>
    <div>
        <span class="l-progress-bar s-progress-bar"
            :class="{'indeterminate': model.progressPerc === 'unknown' }">
            <span class="progress-amt-holder" style="min-width: 100px; min-height: 20px; display: inherit;">
                <span class="progress-amt" :style="`width: ${model.progressPerc}px;`"></span>
            </span>
        </span>
        <div class="progress-info hint" v-if="model.progressText !== undefined">
            <span class="progress-amt-text" v-if="model.progressPerc > 0">{{model.progressPerc}}% complete. </span>
            {{model.progressText}}
        </div>
    </div>
</template>

<style lang="scss">

</style>

<script>
export default {
    props:['model']
}
</script>
