/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

<template>
<canvas
    ref="canvas"
    class="c-image-canvas"
    style="width: 100%; height: 100%;"
    @mousedown="clearSelectedAnnotations"
    @mousemove="trackAnnotationDrag"
    @click="selectOrCreateAnnotation"
></canvas>
</template>

<script>

import Flatbush from 'flatbush';
const EXISTING_ANNOTATION_STROKE_STYLE = "#D79078";
const EXISTING_ANNOTATION_FILL_STYLE = "rgba(202, 202, 142, 0.2)";
const SELECTED_ANNOTATION_STROKE_COLOR = "#BD8ECC";
const SELECTED_ANNOTATION_FILL_STYLE = "rgba(199, 87, 231, 0.2)";

export default {
    inject: ['openmct', 'domainObject', 'objectPath'],
    props: {
        image: {
            type: Object,
            required: true
        },
        imageryAnnotations: {
            type: Array,
            default() {
                return [];
            }
        }
    },
    data() {
        return {
            dragging: false,
            mouseDown: false,
            newAnnotationRectangle: {},
            keyString: null,
            context: null,
            canvas: null,
            annotationsIndex: null,
            selectedAnnotations: [],
            indexToAnnotationMap: {}
        };
    },
    watch: {
        imageryAnnotations() {
            this.buildAnnotationIndex();
        }
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.context = this.canvas.getContext("2d");
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.openmct.selection.on('change', this.updateSelection);
        this.buildAnnotationIndex();
    },
    beforeDestroy() {
        console.debug(`🚮 Canvas destroyed`);
        this.openmct.selection.off('change', this.updateSelection);
        document.body.removeEventListener('click', this.cancelSelection);
    },
    methods: {
        buildAnnotationIndex() {
            if (this.imageryAnnotations.length) {
                // create a flatbush index for the annotations
                this.annotationsIndex = new Flatbush(this.imageryAnnotations.length);
                this.imageryAnnotations.forEach((annotation) => {
                    const annotationRectangle = annotation.targets[this.keyString].rectangle;
                    const indexNumber = this.annotationsIndex.add(annotationRectangle.x, annotationRectangle.y, annotationRectangle.x + annotationRectangle.width, annotationRectangle.y + annotationRectangle.height);
                    this.indexToAnnotationMap[indexNumber] = annotation;
                });
                this.annotationsIndex.finish();

                this.drawAnnotations();
            }
        },
        onAnnotationChange(annotations) {
            this.selectedAnnotations = annotations;
            this.buildAnnotationIndex();
        },
        updateSelection(selection) {
            const selectionContext = selection?.[0]?.[0]?.context?.item;
            const selectionType = selection?.[0]?.[0]?.context?.type;
            const validSelectionTypes = ['clicked-on-image-selection'];

            if (!validSelectionTypes.includes(selectionType)) {
                // wrong type of selection
                return;
            }

            if (selectionContext
                && this.openmct.objects.areIdsEqual(selectionContext.identifier, this.domainObject.identifier)) {
                return;
            }

            const incomingSelectedAnnotations = selection?.[0]?.[0]?.context?.annotations;

            this.prepareExistingAnnotationSelection(incomingSelectedAnnotations);
        },
        prepareExistingAnnotationSelection(annotations) {
            const targetDomainObjects = {};
            targetDomainObjects[this.keyString] = this.domainObject;

            const targetDetails = {};
            annotations.forEach(annotation => {
                Object.entries(annotation.targets).forEach(([key, value]) => {
                    targetDetails[key] = value;
                });
            });
            this.selectedAnnotations = annotations;
            this.drawAnnotations();

            return {
                targetDomainObjects,
                targetDetails
            };
        },
        clearSelectedAnnotations() {
            if (!this.openmct.annotation.getAvailableTags().length) {
                // don't bother with new annotations if there are no tags
                return;
            }

            this.mouseDown = true;
            this.selectedAnnotations = [];
        },
        drawRectInCanvas(rectangle, fillStyle, strokeStyle) {
            this.context.beginPath();
            this.context.lineWidth = "1";
            this.context.fillStyle = fillStyle;
            this.context.strokeStyle = strokeStyle;
            this.context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            this.context.fill();
            this.context.stroke();
        },
        trackAnnotationDrag(event) {
            if (this.mouseDown && !this.dragging && event.shiftKey) {
                this.startAnnotationDrag(event);
            } else if (this.dragging) {
                const boundingRect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / boundingRect.width;
                const scaleY = this.canvas.height / boundingRect.height;
                this.newAnnotationRectangle = {
                    x: this.newAnnotationRectangle.x,
                    y: this.newAnnotationRectangle.y,
                    width: ((event.clientX - boundingRect.left) * scaleX) - this.newAnnotationRectangle.x,
                    height: ((event.clientY - boundingRect.top) * scaleY) - this.newAnnotationRectangle.y
                };
                this.drawAnnotations();
                this.drawRectInCanvas(this.newAnnotationRectangle, SELECTED_ANNOTATION_FILL_STYLE, SELECTED_ANNOTATION_STROKE_COLOR);
            }
        },
        clearCanvas() {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        selectImageView() {
            // should show ImageView itself if we have no annotations to display
            const selection = this.createPathSelection();
            this.openmct.selection.select(selection, true);
        },
        createSelection(annotation) {
            const selection = this.createPathSelection();
            selection[0].context = annotation;

            return selection;
        },
        selectImageAnnotations({targetDetails, targetDomainObjects, annotations}) {
            const annotationContext = {
                type: 'clicked-on-image-selection',
                targetDetails,
                targetDomainObjects,
                annotations,
                annotationType: this.openmct.annotation.ANNOTATION_TYPES.PIXEL_SPATIAL,
                onAnnotationChange: this.onAnnotationChange
            };
            const selection = this.createPathSelection();
            if (selection.length && this.openmct.objects.areIdsEqual(selection[0].context.item.identifier, this.domainObject.identifier)) {
                selection[0].context = {
                    ...selection[0].context,
                    ...annotationContext
                };
            } else {
                selection.unshift({
                    element: this.$el,
                    context: {
                        item: this.domainObject,
                        ...annotationContext
                    }
                });
            }

            this.openmct.selection.select(selection, true);

            document.body.addEventListener('click', this.cancelSelection);
        },
        cancelSelection(event) {
            if (this.$refs.canvas) {
                const clickedInsideCanvas = this.$refs.canvas.contains(event.target);
                const clickedInsideInspector = event.target.closest('.js-inspector') !== null;
                const clickedOption = event.target.closest('.js-autocomplete-options') !== null;
                if (!clickedInsideCanvas && !clickedInsideInspector && !clickedOption) {
                    this.newAnnotationRectangle = {};
                    this.selectedAnnotations = [];
                    this.drawAnnotations();
                }
            }
        },
        createNewAnnotation() {
            this.dragging = false;
            this.selectedAnnotations = [];

            const targetDomainObjects = {};
            targetDomainObjects[this.keyString] = this.domainObject;
            const targetDetails = {};
            targetDetails[this.keyString] = {
                rectangle: {
                    x: this.newAnnotationRectangle.x,
                    y: this.newAnnotationRectangle.y,
                    width: this.newAnnotationRectangle.width,
                    height: this.newAnnotationRectangle.height
                },
                time: this.image.time
            };
            this.selectImageAnnotations({
                targetDetails,
                targetDomainObjects,
                annotations: []
            });
        },
        attemptToSelectExistingAnnotation(event) {
            this.dragging = false;
            // use flatbush to find annotations that are close to the click
            const boundingRect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / boundingRect.width;
            const scaleY = this.canvas.height / boundingRect.height;
            const x = (event.clientX - boundingRect.left) * scaleX;
            const y = (event.clientY - boundingRect.top) * scaleY;
            if (this.annotationsIndex) {
                let nearbyAnnotations = [];
                const resultIndicies = this.annotationsIndex.search(x, y, x, y);
                resultIndicies.forEach((resultIndex) => {
                    const foundAnnotation = this.indexToAnnotationMap[resultIndex];

                    nearbyAnnotations.push(foundAnnotation);
                });
                //show annotations if some were found
                const { targetDomainObjects, targetDetails } = this.prepareExistingAnnotationSelection(nearbyAnnotations);
                this.selectImageAnnotations({
                    targetDetails,
                    targetDomainObjects,
                    annotations: nearbyAnnotations
                });
            } else {
                // nothing selected
                this.drawAnnotations();
            }
        },
        selectOrCreateAnnotation(event) {
            event.stopPropagation();
            this.mouseDown = false;
            if ((!this.dragging) || (!this.newAnnotationRectangle.width && !this.newAnnotationRectangle.height)) {
                this.newAnnotationRectangle = {};
                this.attemptToSelectExistingAnnotation(event);
            } else {
                this.createNewAnnotation();
            }

        },
        createPathSelection() {
            let selection = [];
            selection.unshift({
                element: this.$el,
                context: {
                    item: this.domainObject
                }
            });
            this.objectPath.forEach((pathObject, index) => {
                selection.push({
                    element: this.openmct.layout.$refs.browseObject.$el,
                    context: {
                        item: pathObject
                    }
                });
            });

            return selection;
        },
        startAnnotationDrag(event) {
            this.newAnnotationRectangle = {};
            const boundingRect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / boundingRect.width;
            const scaleY = this.canvas.height / boundingRect.height;
            this.newAnnotationRectangle = {
                x: (event.clientX - boundingRect.left) * scaleX,
                y: (event.clientY - boundingRect.top) * scaleY
            };
            this.dragging = true;
        },
        isSelectedAnnotation(annotation) {
            const someSelectedAnnotationExists = this.selectedAnnotations.some((selectedAnnotation) => {
                return this.openmct.objects.areIdsEqual(selectedAnnotation.identifier, annotation.identifier);
            });

            return someSelectedAnnotationExists;
        },
        drawAnnotations() {
            this.clearCanvas();
            this.imageryAnnotations.forEach((annotation) => {
                if (this.isSelectedAnnotation(annotation)) {
                    this.drawRectInCanvas(annotation.targets[this.keyString].rectangle, SELECTED_ANNOTATION_FILL_STYLE, SELECTED_ANNOTATION_STROKE_COLOR);
                } else {
                    this.drawRectInCanvas(annotation.targets[this.keyString].rectangle, EXISTING_ANNOTATION_FILL_STYLE, EXISTING_ANNOTATION_STROKE_STYLE);
                }
            });
        }
    }
};
</script>
