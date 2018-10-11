<template>
    <div class="l-message"
     v-bind:class="['message-severity-' + model.severity]">
        <div class="w-message-contents">
            <div class="top-bar">
                <div class="title">{{model.title}}</div>
            </div>
            <div class="hint" v-if="model.hint">
                {{model.hint}}
                <span v-if="model.timestamp">[{{model.timestamp}}]</span>
            </div>
            <div class="message-body">
                <div class="message-action">
                    {{model.actionText}}
                </div>

                <div class="banner-elem" v-if="model.progress !== undefined">
                    <span class="l-progress-bar s-progress-bar"
                        :class="{'indeterminate': model.unknownProgress }">
                        <span class="progress-amt-holder">
                            <span class="progress-amt" :style="progressWidth"></span>
                        </span>
                    </span>
                    <div class="progress-info hint" v-if="progressText !== undefined">
                        <span class="progress-amt-text" v-if="progressValue > 0">{{progressValue}}% complete. </span>
                        {{progressText}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style <style lang="sass">

</style>
<script>
export default {
    inject:['model'],
    props: ['progressValue', 'progressText'],
    computed: {
        progressWidth() {
            return {width: this.progressValue + '%'};
        }
    }
}
</script>
