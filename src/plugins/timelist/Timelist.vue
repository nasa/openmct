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
<div ref="timelistHolder"
     class="c-timelist"
>
    <list-view :items="planActivities"
               :header-items="headerItems"
               :default-sort="defaultSort"
    />
</div>
</template>

<script>
import { getValidatedPlan } from "../plan/util";
import ListView from '../../ui/components/List/ListView.vue';
import { getPreciseDuration } from "../../utils/duration";

import moment from "moment";
import uuid from "uuid";

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';
const headerItems = [{
    defaultDirection: true,
    property: 'name',
    name: 'Activity'
}, {
    defaultDirection: true,
    isSortable: true,
    property: 'start',
    name: 'Start Time',
    format: function (value, object) {
        return `${moment(value).format(TIME_FORMAT)}Z`;
    }
}, {
    defaultDirection: true,
    property: 'end',
    name: 'End Time',
    format: function (value, object) {
        return `${moment(value).format(TIME_FORMAT)}Z`;
    }
},
{
    defaultDirection: false,
    property: 'end',
    name: 'Time To/From',
    format: function (value, object) {
        const now = Date.now();
        let result;
        if (object.start < now) {
            const duration = now - object.start;
            result = `-${getPreciseDuration(duration)}`;
        } else if (object.end >= now) {
            const duration = object.end - now;
            result = `+${getPreciseDuration(duration)}`;
        } else {
            result = 'Now';
        }

        return result;
    }
}];
const defaultSort = 'start';

export default {
    components: {
        ListView
    },
    inject: ['openmct', 'domainObject', 'path'],
    data() {
        return {
            viewBounds: undefined,
            timeSystem: undefined,
            height: 0,
            planActivities: [],
            headerItems: headerItems,
            defaultSort: defaultSort
        };
    },
    mounted() {
        this.getPlanData(this.domainObject);
        this.listActivities();
        this.setTimeContext();
        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);
        this.removeStatusListener = this.openmct.status.observe(this.domainObject.identifier, this.setStatus);
        this.status = this.openmct.status.get(this.domainObject.identifier);
    },
    beforeDestroy() {
        this.stopFollowingTimeContext();
        if (this.unlisten) {
            this.unlisten();
        }

        if (this.removeStatusListener) {
            this.removeStatusListener();
        }
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.path);
            this.followTimeContext();
        },
        followTimeContext() {
            this.updateViewBounds(this.timeContext.bounds());

            this.timeContext.on("timeSystem", this.listActivities);
            this.timeContext.on("bounds", this.updateViewBounds);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off("timeSystem", this.listActivities);
                this.timeContext.off("bounds", this.updateViewBounds);
            }
        },
        observeForChanges(mutatedObject) {
            this.getPlanData(mutatedObject);
            this.listActivities();
        },
        getPlanData(domainObject) {
            this.planData = getValidatedPlan(domainObject);
        },
        updateViewBounds(bounds) {
            if (bounds) {
                this.viewBounds = Object.create(bounds);
            }

            if (this.timeSystem === undefined) {
                this.timeSystem = this.openmct.time.timeSystem();
            }

            this.planActivities = this.applyStyles(this.planActivities);
        },
        listActivities(timeSystem) {
            if (timeSystem !== undefined) {
                this.timeSystem = timeSystem;
            }

            this.clearPreviousActivities();
            let groups = Object.keys(this.planData);
            let activities = [];

            groups.forEach((key) => {
                activities = activities.concat(this.planData[key]);
            });
            //add css class for list items that are active now
            activities = this.applyStyles(activities);
            // sort by start time
            this.planActivities = activities.sort(this.sortByStartTime);
        },
        clearPreviousActivities() {
        },
        isActivityInBounds(activity) {
            if (!this.viewBounds) {
                return;
            }

            return (activity.start < this.viewBounds.end) && (activity.end > this.viewBounds.start);
        },
        applyStyles(activities) {
            return activities.map((activity) => {
                if (this.isActivityInBounds(activity)) {
                    activity.cssClass = 'c-current';
                } else {
                    activity.cssClass = '';
                }

                if (!activity.key) {
                    activity.key = uuid();
                }

                return activity;
            });
        },
        sortByStartTime(a, b) {
            const numA = parseInt(a.start, 10);
            const numB = parseInt(b.start, 10);
            if (numA > numB) {
                return 1;
            }

            if (numA < numB) {
                return -1;
            }

            return 0;
        },
        setStatus(status) {
            this.status = status;
            if (this.xScale) {
                this.drawPlan();
            }
        }
    }
};
</script>
