<!--
 Open MCT, Copyright (c) 2014-2022, United States Government
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
<div
    ref="plotWrapper"
    class="c-plot holder holder-plot has-control-bar"
    :class="staleClass"
>
    <div
        ref="plotContainer"
        class="l-view-section u-style-receiver js-style-receiver"
        :class="{'s-status-timeconductor-unsynced': status && status === 'timeconductor-unsynced'}"
    >
        <progress-bar
            v-show="!!loading"
            class="c-telemetry-table__progress-bar"
            :model="{progressPerc: undefined}"
        />
        <mct-plot
            :init-grid-lines="gridLines"
            :init-cursor-guide="cursorGuide"
            :options="options"
            @loadingUpdated="loadingUpdated"
            @statusUpdated="setStatus"
        />
    </div>
</div>
</template>

<script>
import eventHelpers from './lib/eventHelpers';
import ImageExporter from '../../exporters/ImageExporter';
import MctPlot from './MctPlot.vue';
import ProgressBar from "../../ui/components/ProgressBar.vue";
import StalenessUtils from '@/utils/staleness';

export default {
    components: {
        MctPlot,
        ProgressBar
    },
    inject: ['openmct', 'domainObject', 'path'],
    props: {
        options: {
            type: Object,
            default() {
                return {
                    compact: false
                };
            }
        }
    },
    data() {
        return {
            //Don't think we need this as it appears to be stacked plot specific
            // hideExportButtons: false
            cursorGuide: false,
            gridLines: !this.options.compact,
            loading: false,
            status: '',
            staleObjects: []
        };
    },
    computed: {
        staleClass() {
            if (this.staleObjects.length !== 0) {
                return 'is-stale';
            }

            return '';
        }
    },
    mounted() {
        eventHelpers.extend(this);
        this.stalenessUtils = new StalenessUtils(this.openmct);
        this.imageExporter = new ImageExporter(this.openmct);
        this.loadComposition();
    },
    beforeDestroy() {
        this.destroy();
    },
    methods: {
        loadComposition() {
            this.compositionCollection = this.openmct.composition.get(this.domainObject);

            if (this.compositionCollection) {
                this.compositionCollection.on('add', this.addItem);
                this.compositionCollection.on('remove', this.removeItem);
                this.compositionCollection.load();
            }

        },
        addItem(object) {
            const keystring = this.openmct.objects.makeKeyString(object.identifier);

            if (!this.unsubscribes) {
                this.unsubscribes = {};
            }

            this.openmct.telemetry.isStale(object).then((stalenessResponse) => {
                this.handleStaleness(keystring, stalenessResponse);
            });
            const unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(object, (stalenessResponse) => {
                this.handleStaleness(keystring, stalenessResponse);
            });

            this.unsubscribes[keystring] = unsubscribeFromStaleness;
        },
        removeItem(object) {
            const keystring = this.openmct.objects.makeKeyString(object);
            this.unsubscribes[keystring]();
            this.handleStaleness(keystring, false);
        },
        handleStaleness(id, stalenessResponse) {
            if (this.stalenessUtils.shouldUpdateStaleness(stalenessResponse, id)) {
                const index = this.staleObjects.indexOf(id);
                if (stalenessResponse.isStale) {
                    if (index === -1) {
                        this.staleObjects.push(id);
                    }
                } else {
                    if (index !== -1) {
                        this.staleObjects.splice(index, 1);
                    }
                }
            }
        },
        loadingUpdated(loading) {
            this.loading = loading;
        },
        destroy() {
            if (this.unsubscribes) {
                Object.values(this.unsubscribes).forEach(unsubscribeFromStaleness => unsubscribeFromStaleness());
            }

            if (this.compositionCollection) {
                this.compositionCollection.off('add', this.addItem);
                this.compositionCollection.off('remove', this.removeItem);
            }

            this.stopListening();
        },
        exportJPG() {
            const plotElement = this.$refs.plotContainer;
            this.imageExporter.exportJPG(plotElement, 'plot.jpg', 'export-plot');
        },
        exportPNG() {
            const plotElement = this.$refs.plotContainer;
            this.imageExporter.exportPNG(plotElement, 'plot.png', 'export-plot');
        },
        setStatus(status) {
            this.status = status;
        },
        getViewContext() {
            return {
                exportPNG: this.exportPNG,
                exportJPG: this.exportJPG
            };
        }
    }
};

</script>
