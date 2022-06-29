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
        this.openmct.objectViews.on('clearData', this.clearData);

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
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }

        this.stopFollowingDataTimeContext();
        this.openmct.objectViews.off('clearData', this.clearData);
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
        isDatumValid(datum) {
            //TODO: Add a check to see if there are duplicate images (identical image timestamp and url subsequently)
            if (!datum) {
                return false;
            }

            const datumTimeCheck = this.parseTime(datum);
            const bounds = this.timeContext.bounds();

            const isOutOfBounds = datumTimeCheck < bounds.start || datumTimeCheck > bounds.end;

            return !isOutOfBounds;
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
            this.requestCount++;
            const requestId = this.requestCount;
            const bounds = this.timeContext.bounds();

            const data = await this.openmct.telemetry
                .request(this.domainObject, bounds) || [];
            // wait until new request resolves to do comparison
            if (this.requestCount !== requestId) {
                return this.imageHistory = [];
            }

            const imagery = data.filter(this.isDatumValid).map(this.normalizeDatum);
            this.imageHistory = imagery;
        },
        clearData(domainObjectToClear) {
            // global clearData button is accepted therefore no truthy check on inputted param
            const clearDataForObjectSelected = Boolean(domainObjectToClear);
            if (clearDataForObjectSelected) {
                const idsEqual = this.openmct.objects.areIdsEqual(
                    domainObjectToClear.identifier,
                    this.domainObject.identifier
                );
                if (!idsEqual) {
                    return;
                }
            }

            // splice array to encourage garbage collection
            this.imageHistory.splice(0, this.imageHistory.length);

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
                    if (!(parsedTimestamp >= bounds.start && parsedTimestamp <= bounds.end)) {
                        return;
                    }

                    if (this.isDatumValid(datum)) {
                        this.imageHistory.push(this.normalizeDatum(datum));
                    }
                });
        },
        normalizeDatum(datum) {

            const formattedTime = this.formatTime(datum);
            const url = this.formatImageUrl(datum);
            const time = this.parseTime(formattedTime);
            const imageDownloadName = this.getImageDownloadName(datum);

            return {
                ...datum,
                formattedTime,
                url,
                time,
                imageDownloadName
            };
        },
        getFormatter(key) {
            let metadataValue = this.metadata.value(key) || { format: key };
            let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

            return valueFormatter;
        }
    }
};
