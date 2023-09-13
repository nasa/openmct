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

import { createOpenMct, resetApplicationState } from '../utils/testing';
import ImageExporter from './ImageExporter';

describe('The Image Exporter', () => {
  let openmct;
  let imageExporter;

  beforeEach(() => {
    openmct = createOpenMct();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('basic instantiation', () => {
    it('can be instantiated', () => {
      imageExporter = new ImageExporter(openmct);

      expect(imageExporter).not.toEqual(null);
    });
    it('can render an element to a blob', async () => {
      const mockHeadElement = document.createElement('h1');
      const mockTextNode = document.createTextNode('foo bar');
      mockHeadElement.appendChild(mockTextNode);
      document.body.appendChild(mockHeadElement);
      imageExporter = new ImageExporter(openmct);
      const returnedBlob = await imageExporter.renderElement(document.body, {
        imageType: 'png'
      });
      expect(returnedBlob).not.toEqual(null);
      expect(returnedBlob.blob).not.toEqual(null);
      expect(returnedBlob.blob).toBeInstanceOf(Blob);
    });
  });
});
