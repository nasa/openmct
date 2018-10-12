<!--
 Open MCT, Copyright (c) 2014-2018, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.
 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.
 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div class="l-message-banner s-message-banner" 
    :class="[
        activeModel.severity,
        {
            'minimized': activeModel.minimized,
            'new': !activeModel.minimized
        }]"
    v-if="activeModel.message">
    <span @click="maximize()" class="banner-elem label">{{activeModel.message}}</span>
    <span @click="maximize()" v-if="activeModel.progressPerc !== undefined">
        <div class="banner-elem"><!-- was mct-include -->
            <span class="l-progress-bar s-progress-bar"
                :class="{'indeterminate': activeModel.progressPerc === 'unknown' }">
                <span class="progress-amt-holder">
                    <span class="progress-amt" :style="progressWidth"></span>
                </span>
            </span>
            <div class="progress-info hint" v-if="activeModel.progressText !== undefined">
                <span class="progress-amt-text" v-if="activeModel.progressPerc > 0">{{activeModel.progressPerc}}% complete. </span>
                {{activeModel.progressText}}
            </div>
        </div>
    </span>
    <a class="close icon-x" @click="dismiss()"></a>
</div>
</template>

<style lang="scss">
    .l-message-banner {
        display: inline;
        left: 50%;
        position: absolute;
    }
    .banner-elem {
        display: inline;
    }
</style>

<script>
    let activeNotification = undefined;
    let dialogService = undefined;
    export default {
        inject: ['openmct'],
        data() {
            return {
                activeModel: {
                    message: undefined,
                    progressPerc: undefined,
                    progressText: undefined,
                    minimized: undefined
                }
            }
        },
        methods: {
            showNotification(notification) {
                if (activeNotification) {
                    activeNotification.off('progress', this.updateProgress);
                    activeNotification.off('minimized', this.minimized);
                    activeNotification.off('destroy', this.destroyActiveNotification);
                }
                activeNotification = notification;
                this.clearModel();
                this.applyModel(notification.model);

                activeNotification.once('destroy', this.destroyActiveNotification);
                activeNotification.on('progress', this.updateProgress);
                activeNotification.on('minimized', this.minimized);
            },
            isEqual(modelA, modelB) {
                return modelA.message === modelB.message &&
                    modelA.timestamp === modelB.timestamp;
            },
            applyModel(model) {
                Object.keys(model).forEach((key) => this.activeModel[key] = model[key]);
            },
            clearModel() {
                Object.keys(this.activeModel).forEach((key) => this.activeModel[key] = undefined);
            },
            updateProgress(progressPerc, progressText) {
                this.activeModel.progressPerc = progressPerc;
                this.activeModel.progressText = progressText;
            },
            destroyActiveNotification() {
                this.clearModel();
                activeNotification = undefined;
            },
            dismiss() {
                if (activeNotification.model.severity === 'info') {
                    activeNotification.dismiss();
                } else {
                    this.openmct.notifications._minimize(activeNotification);
                }
            },
            minimized() {
                this.activeModel.minimized = true;
                activeNotification.off('progress', this.updateProgress);
                activeNotification.off('minimized', this.minimized);
                activeNotification.off('destroy', this.destroyActiveNotification);
            },
            maximize() {
                //Not implemented yet.
            }
        },
        computed: {
            progressWidth() {
                return {
                    width: this.activeModel.progress + '%'
                };
            }
        },
        mounted() {
            openmct.notifications.on('notification', this.showNotification);
        }

    }
</script>
