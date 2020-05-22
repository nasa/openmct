<template>
<div 
    class="c-message"
    :class="'message-severity-' + notification.severity">
    <div class="c-ne__time-and-content">
        <div class="c-ne__time">
            <span>{{ notification.timestamp }}</span>
        </div>
        <div class="c-ne__content">
            <div class="w-message-contents">
                <div class="c-message__top-bar">
                    <div class="c-message__title">{{notification.message}}</div>
                </div>
                <div class="message-body">
                    <!-- <mct-include key="'progress-bar'"
                                    ng-model="ngModel"
                                    ng-show="ngModel.progressPerc !== undefined"></mct-include> -->
                </div>
            </div>
        </div>
         <div class="c-overlay__button-bar">
            <button v-for="(dialogOption, index) in notification.options"
                    :key="index"
                    class="c-button"
                    @click="dialogOption.callback()">
                {{dialogOption.label}}
            </button>
            <button class="c-button c-button--major"
                    v-if="notification.primaryOption"
                    @click="notification.primaryOption.callback()">
                {{notification.primaryOption.label}}
            </button>
        </div>
    </div>
</div> 
</template>

<script>
export default {
    props:['notification']
}
</script>