/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

export default {
    inject: ['openmct', 'domainObject', 'objectPath'],
    mounted() {
        // set
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.imageHints = { ...this.metadata.valuesForHints(['image'])[0] };
        this.imageFormatter = this.openmct.telemetry.getValueFormatter(this.imageHints);
        this.imageDownloadNameHints = { ...this.metadata.valuesForHints(['imageDownloadName'])[0]};

        this.telemetryCollection = this.openmct.telemetry.requestCollection(this.domainObject, {
            size: 1,
            strategy: 'latest'
        });
        this.telemetryCollection.on('add', this.normalizeDatum);
        this.telemetryCollection.on('clear', this.clearData);
        this.telemetryCollection.load();
    },
    beforeDestroy() {
        this.openmct.objectViews.off('clearData', this.clearData);
        this.telemetryCollection.off('add', this.normalizeDatum);
        this.telemetryCollection.off('clear', this.clearData);

        this.telemetryCollection.destroy();
    },
    methods: {
        formatImageUrl(datum) {
            if (!datum) {
                return;
            }

            return this.imageFormatter.format(datum);
        },
        formatTime(datum) {
            if (!datum) {
                return;
            }

            let dateTimeStr = this.timeFormatter.format(datum);

            // Replace ISO "T" with a space to allow wrapping
            return dateTimeStr.replace("T", " ");
        },
        getImageDownloadName(datum) {
            let imageDownloadName = '';
            if (datum) {
                const key = this.imageDownloadNameHints.key;
                imageDownloadName = datum[key];
            }

            return imageDownloadName;
        },
        normalizeDatum(datum) {
            const latestDatum = datum[datum.length - 1];

            let image = { ...latestDatum };
            image.formattedTime = this.formatTime(latestDatum);
            image.url = this.formatImageUrl(latestDatum);
            image.imageDownloadName = this.getImageDownloadName(latestDatum);

            return image;
        }
    }
};
