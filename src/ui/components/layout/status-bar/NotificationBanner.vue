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
    v-if="activeModel.title">
    <span @click="maximize()" class="banner-elem label">{{activeModel.title}}</span>
    <span @click="maximize()" v-if="activeModel.progress !== undefined || activeModel.unknownProgress">
        <div class="banner-elem"><!-- was mct-include -->
            <span class="l-progress-bar s-progress-bar"
                :class="{'indeterminate': activeModel.unknownProgress }">
                <span class="progress-amt-holder">
                    <span class="progress-amt" :style="progressWidth"></span>
                </span>
            </span>
            <div class="progress-info hint" v-if="activeModel.progressText !== undefined">
                <span class="progress-amt-text" v-if="activeModel.progress > 0">{{activeModel.progress}}% complete. </span>
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
    import _ from 'lodash';

    let activeNotification = undefined;
    let dialogService = undefined;
    export default {
        inject: ['openmct'],
        data() {
            return {
                activeModel: {
                    title: undefined,
                    progress: undefined,
                    progressText: undefined,
                    unknownProgress: undefined,
                    minimized: undefined
                }
            }
        },
        methods: {
            showNotification(notification) {
                activeNotification = notification;
                this.applyModel(notification.model);

                activeNotification.once('destroy', () => {
                    if (_.eq(this.activeModel, notification.model)){
                        this.clearModel();
                        activeNotification = undefined;
                    }
                });
                activeNotification.on('progress', this.updateProgress);
                activeNotification.on('minimized', this.minimized);
            },
            applyModel(model) {
                Object.keys(model).forEach((key) => this.activeModel[key] = model[key]);
            },
            clearModel() {
                Object.keys(this.activeModel).forEach((key) => this.activeModel[key] = undefined);
            },
            updateProgress(progress, progressText) {
                this.activeModel.progress = progress;
                this.activeModel.progressText = progressText;
            },
            dismiss() {
                activeNotification.off('progress', this.updateProgress);
                activeNotification.off('minimized', this.minimized);
                activeNotification.dismiss();
            },
            minimized() {
                this.activeModel.minimized = true;
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
