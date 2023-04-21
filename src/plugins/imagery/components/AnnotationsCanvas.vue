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
        }
    },
    data() {
        return {
            dragging: false,
            mouseDown: false,
            newAnnotationRectangle: {},
            annotationsForThisImage: [],
            keyString: null,
            context: null,
            canvas: null,
            annotationsIndex: null,
            selectedAnnotations: [],
            indexToAnnotationMap: {}
        };
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.context = this.canvas.getContext("2d");
        console.debug(`🔮 AnnotationsCanvas mounted`, this.context);
        this.loadAnnotations();
    },
    beforeDestroy() {
    },
    methods: {
        async loadAnnotations() {
            // find annotations for this image time
            const annotationsForThisObject = await this.openmct.annotation.getAnnotations(this.domainObject.identifier);
            this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.annotationsForThisImage = annotationsForThisObject.filter((foundAnnotation) => {
                const annotationTime = foundAnnotation.targets[this.keyString].time;

                return annotationTime === this.image.time;
            });
            if (this.annotationsForThisImage.length) {
            // create a flatbush index for the annotations
                this.annotationsIndex = new Flatbush(this.annotationsForThisImage.length);
                this.annotationsForThisImage.forEach((annotation) => {
                    const annotationRectangle = annotation.targets[this.keyString].rectangle;
                    const indexNumber = this.annotationsIndex.add(annotationRectangle.x, annotationRectangle.y, annotationRectangle.x + annotationRectangle.width, annotationRectangle.y + annotationRectangle.height);
                    this.indexToAnnotationMap[indexNumber] = annotation;
                });
                this.annotationsIndex.finish();

                this.drawAnnotations();
            }
        },
        clearSelectedAnnotations() {
            console.debug(`🐁 mouseDown`);
            this.mouseDown = true;
            this.selectedAnnotations = [];
        },
        drawRectInCanvas(rectangle, fillStyle, strokeStyle) {
            console.debug(`🪟 Drawing rectangle, ${rectangle.x} ${rectangle.y} ${rectangle.width} ${rectangle.height}`, rectangle);
            this.context.beginPath();
            this.context.lineWidth = "1";
            this.context.fillStyle = fillStyle;
            this.context.strokeStyle = strokeStyle;
            this.context.rect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            this.context.fill();
            this.context.stroke();
        },
        trackAnnotationDrag(event) {
            if (this.mouseDown && !this.dragging) {
                this.startAnnotationDrag(event);
            } else if (this.dragging) {
                console.debug(`🐭 mouseMove with existing drag: ${event.type}`);
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
        createNewAnnotation() {
            this.dragging = false;
            this.selectedAnnotations = [];

            console.debug(`🖼️ Creating new image annotation`);

            const keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            const targetDetails = {};
            targetDetails[keyString] = {
                rectangle: {
                    x: this.newAnnotationRectangle.x,
                    y: this.newAnnotationRectangle.y,
                    width: this.newAnnotationRectangle.width,
                    height: this.newAnnotationRectangle.height
                },
                time: this.image.time
            };
            const targetDomainObjects = {};
            targetDomainObjects[keyString] = this.domainObject;
            const annotationContext = {
                type: 'clicked-on-image-selection',
                targetDetails,
                targetDomainObjects,
                annotations: [],
                annotationType: this.openmct.annotation.ANNOTATION_TYPES.PIXEL_SPATIAL,
                onAnnotationChange: null
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

            console.debug(`🍊 firing selection event`, selection);
            this.openmct.selection.select(selection, true);
            // would add cancel selection here
        },
        attemptToSelectExistingAnnotation(event) {
            // use flatbush to find annotations that are close to the click
            const boundingRect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / boundingRect.width;
            const scaleY = this.canvas.height / boundingRect.height;
            const x = (event.clientX - boundingRect.left) * scaleX;
            const y = (event.clientY - boundingRect.top) * scaleY;
            if (this.annotationsIndex) {
                const resultIndicies = this.annotationsIndex.search(x, y, x, y);
                resultIndicies.forEach((resultIndex) => {
                    const foundAnnotation = this.indexToAnnotationMap[resultIndex];
                    console.debug(`🐭 found annotations at ${x} ${y}`, foundAnnotation);

                    this.selectedAnnotations.push(foundAnnotation);
                });
                this.drawAnnotations();
            }
        },
        selectOrCreateAnnotation(event) {
            event.stopPropagation();
            this.mouseDown = false;
            console.debug(`🐭 mouseClick`);
            if ((!this.dragging) || (this.newAnnotationRectangle.width && !this.newAnnotationRectangle.height)) {
                console.debug(`🐭 checking for existing annotations`);
                this.newAnnotationRectangle = {};
                this.attemptToSelectExistingAnnotation(event);
            } else {
                console.debug(`🐭 creating new annotation`);
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
            console.debug(`🐭 mouseMoving for new drag`);
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
            console.debug(`someSelectedAnnotationExists`, someSelectedAnnotationExists);

            return someSelectedAnnotationExists;
        },
        drawAnnotations() {
            this.clearCanvas();
            this.annotationsForThisImage.forEach((annotation) => {
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
