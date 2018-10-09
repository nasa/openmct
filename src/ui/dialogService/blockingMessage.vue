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
            </div>
            <div class="bottom-bar">
                <a class="s-button major"
                v-if="model.primaryOption"
                @click="model.primaryOption.callback()">
                    {{model.primaryOption.label}}
                </a>
            </div>
        </div>
    </div>
</template>
<style <style lang="sass">

</style>
<script>
export default {
    inject:['model']
}
</script>
