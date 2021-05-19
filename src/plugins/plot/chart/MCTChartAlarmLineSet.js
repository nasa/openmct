/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import eventHelpers from '../lib/eventHelpers';

export default class MCTChartAlarmLineSet {
    constructor(series, chart, offset) {
        this.series = series;
        this.chart = chart;
        this.offset = offset;
        this.buffer = new Float32Array(20000);
        this.count = 0;

        eventHelpers.extend(this);

        this.listenTo(series, 'limits', this.appendPoints, this);
        this.listenTo(series, 'removeLimit', this.remove, this);
        this.listenTo(series, 'resetLimit', this.reset, this);
        this.listenTo(series, 'destroyLimit', this.destroy, this);
        if (series.limits) {
            this.appendPoints(series.limits, series);
        }
    }

    getBuffer(offset) {
        if (this.isTempBuffer) {
            this.buffer = new Float32Array(this.buffer);
            this.isTempBuffer = false;
        }

        return offset !== undefined ? this.buffer.slice(offset * 2) : this.buffer;
    }

    color() {
        return this.series.get('color');
    }

    vertexCountForPointAtIndex(index) {
        return 2;
    }

    startIndexForPointAtIndex(index) {
        return 2 * index;
    }

    removeSegments(index, count) {
        const target = index;
        const start = index + count;
        const end = this.count * 2;
        this.buffer.copyWithin(target, start, end);
        for (let zero = end - count; zero < end; zero++) {
            this.buffer[zero] = 0;
        }
    }

    removePoint(point, index, count) {
        // by default, do nothing.
    }

    remove(point, index, series) {
        const vertexCount = this.vertexCountForPointAtIndex(index);
        const removalPoint = this.startIndexForPointAtIndex(index);

        this.removeSegments(removalPoint, vertexCount);

        this.removePoint(
            this.makePoint(point, series),
            removalPoint,
            vertexCount
        );
        this.count -= (vertexCount / 2);
    }

    makePoint(point, series) {
        if (!this.offset.xVal) {
            this.chart.setOffset(point, undefined, series);
        }

        console.log(point, this.offset.xVal(point, series));

        return {
            x: this.count % 2 > 0 ? 2000000 : this.offset.yVal(point, series),
            y: this.offset.yVal(point, series)
        };
    }

    appendPoints(limits, series) {
        const start = this.chart.bounds.start;
        const end = this.chart.bounds.end;
        let index = 0;
        Object.keys(limits).forEach((key) => {
            if (key === 'sin') {
                this.append({
                    [key]: limits[key].high,
                    'utc': start
                }, index, series);
                index++;
                this.append({
                    [key]: limits[key].high,
                    'utc': end
                }, index, series);
                index++;
                this.append({
                    [key]: limits[key].low,
                    'utc': start
                }, index, series);
                index++;
                this.append({
                    [key]: limits[key].low,
                    'utc': end
                }, index, series);
                index++;
            }
        }, this);
        console.log(this.getBuffer(), this.count);
    }

    append(point, index, series) {
        const pointsRequired = this.vertexCountForPointAtIndex(index);
        const insertionPoint = this.startIndexForPointAtIndex(index);
        this.growIfNeeded(pointsRequired);
        this.makeInsertionPoint(insertionPoint, pointsRequired);
        const newPoint = this.makePoint(point, series);
        this.addPoint(
            newPoint,
            insertionPoint,
            pointsRequired
        );
        this.count += (pointsRequired / 2);
    }

    addPoint(point, start, count) {
        this.buffer[start] = point.x;
        this.buffer[start + 1] = point.y;
    }

    makeInsertionPoint(insertionPoint, pointsRequired) {
        if (this.count * 2 > insertionPoint) {
            if (!this.isTempBuffer) {
                this.buffer = Array.prototype.slice.apply(this.buffer);
                this.isTempBuffer = true;
            }

            const target = insertionPoint + pointsRequired;
            let start = insertionPoint;
            for (; start < target; start++) {
                this.buffer.splice(start, 0, 0);
            }
        }
    }

    reset() {
        this.buffer = new Float32Array(20000);
        this.count = 0;
    }

    growIfNeeded(pointsRequired) {
        const remainingPoints = this.buffer.length - this.count * 2;
        let temp;

        if (remainingPoints <= pointsRequired) {
            temp = new Float32Array(this.buffer.length + 20000);
            temp.set(this.buffer);
            this.buffer = temp;
        }
    }

    destroy() {
        this.stopListening();
    }

}
