<template>
<div ref="cMenu"
    class="c-overlay l-overlay-small"
     @click.prevent.stop
>
    <div class="c-overlay__blocker"
         @click="options.dismiss"
    ></div>
    <div class="c-overlay__outer">
        <button class="c-click-icon c-overlay__close-button icon-x"
                :data-dismiss="true"
                @click="options.dismiss"
        ></button>
        <div class="c-overlay__contents">
            <div class="c-overlay__top-bar">
                <div class="c-overlay__dialog-title c-dialog__title">{{ options.title }}</div>
                <div class="c-overlay__dialog-hint hint">All * fields are required.</div>
            </div>
            <div class="c-form form">
                <div class="c-form__row validates req form-row">
                    <div class="c-form__row__label label">Comment *</div>
                    <div class="c-form__row__controls controls">
                        <textarea id="comment"
                                  required
                                  name="comment"
                                  rows="5"
                                  cols="33"
                                  :value="value"
                                  v-bind="$attrs"
                                  v-on="commentListeners"
                        >
                        </textarea>
                    </div>
                </div>

                <div class="c-form__row validates req form-row"
                     v-if="showDuration"
                >
                    <div class="c-form__row__label label">Duration in mins (optional, blank = indefinite)</div>
                    <div class="c-form__row__controls controls">
                        <input id="duration"
                               type="number"
                               step="10"
                               min="0"
                               :minutes="minutes"
                               v-bind="$attrs"
                               v-on="inputListeners"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="c-overlay__button-bar">
            <button class="c-button c-button--major"
                    :data-dismiss="true"
                    :disabled="disableSubmit"
                    @click="submitComment"
            >
                OK
            </button>
            <button class="c-button"
                    :data-dismiss="true"
                    @click="options.dismiss"
            >
                Cancel
            </button>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'CommentMenu',
    props: {
        options: {
            type: Object,
            required: false,
            default() {
                return {};
            }
        }
    },
    data: function () {
        return {
            value: '',
            minutes: 0
        };
    },
    computed: {
        disableSubmit() {
            return this.value.length === 0;
        },
        commentListeners(action = {}) {
            let self = this;

            return Object.assign({},
                this.$listeners,
                {
                    input: function (event) {
                        self.value = event.target.value;
                    }
                }
            );
        },
        inputListeners(action = {}) {
            let self = this;

            return Object.assign({},
                this.$listeners,
                {
                    input: function (event) {
                        self.minutes = event.target.value;
                    }
                }
            );
        },
        showDuration() {
            return this.options.isSuppress || this.options.isSnooze;
        }
    },
    methods: {
        submitComment() {
            this.options.callback({
                comment: this.value,
                duration: this.minutes
            });
            this.options.dismiss();
        }
    },
    mounted() {
    },
    beforeDestroy() {
    }
};
</script>
