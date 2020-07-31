<template>
<div
    class="c-message"
    :class="'message-severity-' + notification.model.severity"
>
    <div class="c-ne__time-and-content">
        <div class="c-ne__time">
            <span>{{ notification.model.timestamp }}</span>
        </div>
        <div class="c-ne__content">
            <div class="w-message-contents">
                <div class="c-message__top-bar">
                    <div class="c-message__title">{{ notification.model.message }}</div>
                </div>
                <div class="message-body">
                    <progress-bar
                        v-if="isProgressNotification"
                        :model="progressObject"
                    />
                </div>
            </div>
        </div>
        <div class="c-overlay__button-bar">
            <button
                v-for="(dialogOption, index) in notification.model.options"
                :key="index"
                class="c-button"
                @click="dialogOption.callback()"
            >
                {{ dialogOption.label }}
            </button>
            <button
                v-if="notification.model.primaryOption"
                class="c-button c-button--major"
                @click="notification.model.primaryOption.callback()"
            >
                {{ notification.model.primaryOption.label }}
            </button>
        </div>
    </div>
</div>
</template>

<script>
import ProgressBar from '../../../ui/components/ProgressBar.vue';

export default {
    components: {
        ProgressBar
    },
    props: {
        notification: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isProgressNotification: false,
            progressPerc: this.notification.model.progressPerc,
            progressText: this.notification.model.progressText
        };
    },
    computed: {
        progressObject() {
            return {
                progressPerc: this.progressPerc,
                progressText: this.progressText
            };
        }
    },
    mounted() {
        if (this.notification.model.progressPerc) {
            this.isProgressNotification = true;
            this.notification.on('progress', this.updateProgressBar);
        }
    },
    methods: {
        updateProgressBar(progressPerc, progressText) {
            this.progressPerc = progressPerc;
            this.progressText = progressText;
        }
    }
};
</script>
