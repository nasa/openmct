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

            <div class="c-message__actions"
                 v-if="model.primaryOption">
                <a class="c-button c-button--major"
                   @click="model.primaryOption.callback()">
                    {{model.primaryOption.label}}
                </a>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-message {
        display: flex;
        padding: $interiorMarginLg;

        > * + * {
            @include test();
            margin-left: $interiorMarginLg;
        }

        &__icon {
            $s: 50px;
            flex: 0 0 auto;
            min-width: $s;
            min-height: $s;

            &.message-severity {
                // TEMP: TODO: replace with SVG background assets
                &-alert {
                    background: $colorAlert;
                }

                &-error {
                    background: $colorFormError;
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
    inject:['model']
}
</script>
