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

const DEFAULT_DURATION_FORMATTER = 'duration';

export default {
    inject: ['openmct', 'domainObject', 'objectPath'],
    mounted() {
        // listen
        this.boundsChange = this.boundsChange.bind(this);
        this.timeSystemChange = this.timeSystemChange.bind(this);
        this.setDataTimeContext = this.setDataTimeContext.bind(this);
        this.setDataTimeContext();

        // set
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.imageHints = { ...this.metadata.valuesForHints(['image'])[0] };
        this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        this.imageFormatter = this.openmct.telemetry.getValueFormatter(this.imageHints);
        this.imageDownloadNameHints = { ...this.metadata.valuesForHints(['imageDownloadName'])[0]};

        // initialize
        this.timeKey = this.timeSystem.key;
        this.timeFormatter = this.getFormatter(this.timeKey);

        // kickoff
        this.subscribe();
        this.requestHistory();
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }

        this.stopFollowingDataTimeContext();
    },
    methods: {
        setDataTimeContext() {
            this.stopFollowingDataTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.objectPath);
            this.timeContext.on('bounds', this.boundsChange);
            this.boundsChange(this.timeContext.bounds());
            this.timeContext.on('timeSystem', this.timeSystemChange);
        },
        stopFollowingDataTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('bounds', this.boundsChange);
                this.timeContext.off('timeSystem', this.timeSystemChange);
            }
        },
        datumIsNotValid(datum) {
            if (this.imageHistory.length === 0) {
                return false;
            }

            const datumURL = this.formatImageUrl(datum);
            const lastHistoryURL = this.formatImageUrl(this.imageHistory.slice(-1)[0]);

            // datum is not valid if it matches the last datum in history,
            // or it is before the last datum in the history
            const datumTimeCheck = this.parseTime(datum);
            const historyTimeCheck = this.parseTime(this.imageHistory.slice(-1)[0]);
            const matchesLast = (datumTimeCheck === historyTimeCheck) && (datumURL === lastHistoryURL);
            const isStale = datumTimeCheck < historyTimeCheck;

            return matchesLast || isStale;
        },
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
        parseTime(datum) {
            if (!datum) {
                return;
            }

            return this.timeFormatter.parse(datum);
        },
        boundsChange(bounds, isTick) {
            if (isTick) {
                return;
            }

            // forcibly reset the imageContainer size to prevent an aspect ratio distortion
            delete this.imageContainerWidth;
            delete this.imageContainerHeight;

            return this.requestHistory();
        },
        async requestHistory() {
            let bounds = this.timeContext.bounds();
            this.requestCount++;
            const requestId = this.requestCount;
            this.imageHistory = [];

            let data = await this.openmct.telemetry
                .request(this.domainObject, bounds) || [];

            if (this.requestCount === requestId) {
                let imagery = [];
                data.forEach((datum) => {
                    let image = this.normalizeDatum(datum);
                    if (image) {
                        imagery.push(image);
                    }
                });
                //this is to optimize anything that reacts to imageHistory length
                this.imageHistory = imagery;
            }
        },
        timeSystemChange() {
            this.timeSystem = this.timeContext.timeSystem();
            this.timeKey = this.timeSystem.key;
            this.timeFormatter = this.getFormatter(this.timeKey);
            this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        },
        subscribe() {
            this.unsubscribe = this.openmct.telemetry
                .subscribe(this.domainObject, (datum) => {
                    let parsedTimestamp = this.parseTime(datum);
                    let bounds = this.timeContext.bounds();

                    if (parsedTimestamp >= bounds.start && parsedTimestamp <= bounds.end) {
                        let image = this.normalizeDatum(datum);
                        if (image) {
                            this.imageHistory.push(image);
                        }
                    }
                });
        },
        normalizeDatum(datum) {
            if (this.datumIsNotValid(datum)) {
                return;
            }

            let image = { ...datum };
            image.formattedTime = this.formatTime(datum);
            image.url = this.formatImageUrl(datum);
            image.time = this.parseTime(image.formattedTime);
            image.imageDownloadName = this.getImageDownloadName(datum);

            return image;
        },
        getFormatter(key) {
            let metadataValue = this.metadata.value(key) || { format: key };
            let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

            return valueFormatter;
        }
    }
};
