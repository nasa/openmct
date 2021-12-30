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
<div ref="plotWrapper"
     class="c-plot"
>
    <div ref="underlay"
         class="c-bar-chart"
    ></div>
</div>
</template>

<script>
import Plotly from 'plotly-basic';
import {getValidatedData} from "@/plugins/plan/util";

const PATH_COLORS = ['blue', 'red', 'green'];
const MARKER_COLOR = 'white';

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        data: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    watch: {
        data: {
            immediate: false,
            handler: 'updatePlot'
        }
    },
    mounted() {
        this.getPlotData(this.domainObject);

        Plotly.newPlot(this.$refs.underlay, Array.from(this.getShapes(this.shapesData)), this.getLayout(this.shapesData), {
            responsive: true,
            displayModeBar: false
        });
        this.registerListeners();
    },
    beforeDestroy() {
        if (this.plotResizeObserver) {
            this.plotResizeObserver.unobserve(this.$refs.plotWrapper);
            clearTimeout(this.resizeTimer);
        }
    },
    methods: {
        getPlotData(domainObject) {
            this.shapesData = getValidatedData(domainObject);
        },
        observeForChanges(mutatedObject) {
            this.getPlotData(mutatedObject);
        },
        registerListeners() {
            this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);

            this.resizeTimer = false;
            if (window.ResizeObserver) {
                this.plotResizeObserver = new ResizeObserver(() => {
                    // debounce and trigger window resize so that plotly can resize the plot
                    clearTimeout(this.resizeTimer);
                    this.resizeTimer = setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 250);
                });
                this.plotResizeObserver.observe(this.$refs.plotWrapper);
            }
        },
        getShapes(data) {
            let markerData = {
                x: [],
                y: []
            };
            const shapes = data.map((shapeData, index1) => {
                if (!shapeData.x || !shapeData.y
                || !shapeData.x.length || !shapeData.y.length
                || shapeData.x.length !== shapeData.y.length) {
                    return "";
                }

                let text = [];
                shapeData.x.forEach((point) => {
                    text.push(`${parseFloat(point).toPrecision(2)}`);
                });

                markerData.x = markerData.x.concat(shapeData.x);
                markerData.y = markerData.y.concat(shapeData.y);

                return {
                    x: shapeData.x,
                    y: shapeData.y,
                    mode: 'text',
                    text,
                    textfont: {
                        family: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                        size: '12px',
                        color: PATH_COLORS[index1]
                    },
                    opacity: 0.5
                };
            });

            shapes.push({
                x: markerData.x,
                y: markerData.y,
                mode: "markers",
                marker: {
                    size: 6,
                    color: MARKER_COLOR
                }
            });

            return shapes;
        },
        getLayout(data) {
            const shapes = data.map((shapeData, index1) => {
                if (!shapeData.x || !shapeData.y
                    || !shapeData.x.length || !shapeData.y.length
                    || shapeData.x.length !== shapeData.y.length) {
                    return "";
                }

                let path = `M ${shapeData.x[0]},${shapeData.y[0]}`;
                shapeData.x.forEach((point, index) => {
                    if (index > 0) {
                        path = `${path} L${point},${shapeData.y[index]}`;
                    }
                });

                return {
                    path,
                    type: 'path',
                    line: {
                        color: PATH_COLORS[index1]
                    },
                    opacity: 0.5
                };
            });

            return {
                shapes,
                layer: 'below',
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                showlegend: false,
                autosize: true,
                //TODO: Revisit rangemode here
                yaxis: {
                    automargin: true,
                    fixedrange: true,
                    rangemode: 'tozero'
                },
                xaxis: {
                    automargin: true,
                    fixedrange: true,
                    rangemode: 'tozero'
                },
                margin: {
                    l: 5,
                    r: 5,
                    t: 5,
                    b: 0
                }
            };
        },
        updatePlot() {
            if (!this.$refs || !this.$refs.underlay) {
                return;
            }

            Plotly.react(this.$refs.underlay, Array.from(this.getShapes(this.shapesData)), this.getLayout(this.shapesData));
        }
    }
};
</script>
