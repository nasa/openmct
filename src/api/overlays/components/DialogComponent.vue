<template>
    <div class="l-message"
        v-bind:class="['message-severity-' + iconClass]">
        <div class="w-message-contents">
            <div class="top-bar" v-if="title">
                <div class="title">{{title}}</div>
            </div>
            <div class="hint" v-if="hint">
                {{hint}}
                <span v-if="model.timestamp">[{{timestamp}}]</span>
            </div>
            <div class="message-body">
                <div class="message-action">
                    {{message}}
                </div>
            </div>
        </div>
    </div>
</template>

<style <style lang="sass">

</style>
<script>
export default {
    inject:['iconClass', 'title', 'hint', 'timestamp', 'message']
}
</script>
