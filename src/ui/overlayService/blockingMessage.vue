<template>
    <div class="c-message"
        v-bind:class="">
        <!-- This element is displayed within the overlay service as well as in the list of messages
        Uses flex-row -->
        <div class="c-message__icon"
             :class="['message-severity-' + model.severity]"></div>
        <div class="c-message__text">
            <!-- Uses flex-column -->
            <div class="c-message__title"
                v-if="model.title">
                {{model.title}}
            </div>
            <div class="c-message__hint"
                 v-if="model.hint">
                {{model.hint}}
                <span v-if="model.timestamp">[{{model.timestamp}}]</span>
            </div>
            <div class="c-message__action-text"
                v-if="model.actionText">
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
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-message {
        display: flex;
        align-items: center;
        padding: $interiorMarginLg;

        > * + * {
            margin-left: $interiorMarginLg;
        }

        &__icon {
            // Holds a background SVG graphic
            $s: 50px;
            flex: 0 0 auto;
            min-width: $s;
            min-height: $s;

            &.message-severity {
                // TEMP: TODO: Move this into a common SCSS file so that messages and notifications can use it as well.
                // Info, alert, error
                &-info {
                    @include glyphBg($bg-icon-info);
                    filter: $colorStatusInfoFilter;
                }

                &-alert {
                    @include glyphBg($bg-icon-alert-rect);
                    filter: $colorStatusAlertFilter;
                }

                &-error {
                    @include glyphBg($bg-icon-alert-triangle);
                    filter: $colorStatusErrorFilter;
                }
            }
        }

        &__text {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;

            > * + * {
                @include test();
                margin-top: $interiorMargin;
            }
        }

        // __text elements
        &__title,
        &__action-text {
            font-size: 1.2em; // TEMP

        }
    }


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
