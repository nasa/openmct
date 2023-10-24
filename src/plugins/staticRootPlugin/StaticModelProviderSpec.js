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

import StaticModelProvider from './StaticModelProvider';
import testStaticDataEmptyNamespace from './test-data/static-provider-test-empty-namespace.json';
import testStaticDataFooNamespace from './test-data/static-provider-test-foo-namespace.json';

describe('StaticModelProvider', function () {
  describe('with empty namespace', function () {
    let staticProvider;

    beforeEach(function () {
      const staticData = JSON.parse(JSON.stringify(testStaticDataEmptyNamespace));
      staticProvider = new StaticModelProvider(staticData, {
        namespace: 'my-import',
        key: 'root'
      });
    });

    describe('rootObject', function () {
      let rootModel;

      beforeEach(function () {
        rootModel = staticProvider.get({
          namespace: 'my-import',
          key: 'root'
        });
      });

      it('is located at top level', function () {
        expect(rootModel.location).toBe('ROOT');
      });

      it('has remapped identifier', function () {
        expect(rootModel.identifier).toEqual({
          namespace: 'my-import',
          key: 'root'
        });
      });

      it('has remapped identifiers in composition', function () {
        expect(rootModel.composition).toContain({
          namespace: 'my-import',
          key: '1'
        });
        expect(rootModel.composition).toContain({
          namespace: 'my-import',
          key: '2'
        });
      });
    });

    describe('childObjects', function () {
      let swg;
      let layout;
      let fixed;

      beforeEach(function () {
        swg = staticProvider.get({
          namespace: 'my-import',
          key: '1'
        });
        layout = staticProvider.get({
          namespace: 'my-import',
          key: '2'
        });
        fixed = staticProvider.get({
          namespace: 'my-import',
          key: '3'
        });
      });

      it('match expected ordering', function () {
        // this is a sanity check to make sure the identifiers map in
        // the correct order.
        expect(swg.type).toBe('generator');
        expect(layout.type).toBe('layout');
        expect(fixed.type).toBe('telemetry.fixed');
      });

      it('have remapped identifiers', function () {
        expect(swg.identifier).toEqual({
          namespace: 'my-import',
          key: '1'
        });
        expect(layout.identifier).toEqual({
          namespace: 'my-import',
          key: '2'
        });
        expect(fixed.identifier).toEqual({
          namespace: 'my-import',
          key: '3'
        });
      });

      it('have remapped composition', function () {
        expect(layout.composition).toContain({
          namespace: 'my-import',
          key: '1'
        });
        expect(layout.composition).toContain({
          namespace: 'my-import',
          key: '3'
        });
        expect(fixed.composition).toContain({
          namespace: 'my-import',
          key: '1'
        });
      });

      it('rewrites locations', function () {
        expect(swg.location).toBe('my-import:root');
        expect(layout.location).toBe('my-import:root');
        expect(fixed.location).toBe('my-import:2');
      });

      it('rewrites matched identifiers in objects', function () {
        expect(layout.configuration.layout.panels['my-import:1']).toBeDefined();
        expect(layout.configuration.layout.panels['my-import:3']).toBeDefined();
        expect(
          layout.configuration.layout.panels['483c00d4-bb1d-4b42-b29a-c58e06b322a0']
        ).not.toBeDefined();
        expect(
          layout.configuration.layout.panels['20273193-f069-49e9-b4f7-b97a87ed755d']
        ).not.toBeDefined();
        expect(fixed.configuration['fixed-display'].elements[0].id).toBe('my-import:1');
      });
    });
  });
  describe('with namespace "foo"', function () {
    let staticProvider;

    beforeEach(function () {
      const staticData = JSON.parse(JSON.stringify(testStaticDataFooNamespace));
      staticProvider = new StaticModelProvider(staticData, {
        namespace: 'my-import',
        key: 'root'
      });
    });

    describe('rootObject', function () {
      let rootModel;

      beforeEach(function () {
        rootModel = staticProvider.get({
          namespace: 'my-import',
          key: 'root'
        });
      });

      it('is located at top level', function () {
        expect(rootModel.location).toBe('ROOT');
      });

      it('has remapped identifier', function () {
        expect(rootModel.identifier).toEqual({
          namespace: 'my-import',
          key: 'root'
        });
      });

      it('has remapped composition', function () {
        expect(rootModel.composition).toContain({
          namespace: 'my-import',
          key: '1'
        });
        expect(rootModel.composition).toContain({
          namespace: 'my-import',
          key: '2'
        });
      });
    });

    describe('childObjects', function () {
      let clock;
      let layout;
      let swg;
      let folder;

      beforeEach(function () {
        folder = staticProvider.get({
          namespace: 'my-import',
          key: 'root'
        });
        layout = staticProvider.get({
          namespace: 'my-import',
          key: '1'
        });
        swg = staticProvider.get({
          namespace: 'my-import',
          key: '2'
        });
        clock = staticProvider.get({
          namespace: 'my-import',
          key: '3'
        });
      });

      it('match expected ordering', function () {
        // this is a sanity check to make sure the identifiers map in
        // the correct order.
        expect(folder.type).toBe('folder');
        expect(swg.type).toBe('generator');
        expect(layout.type).toBe('layout');
        expect(clock.type).toBe('clock');
      });

      it('have remapped identifiers', function () {
        expect(folder.identifier).toEqual({
          namespace: 'my-import',
          key: 'root'
        });
        expect(layout.identifier).toEqual({
          namespace: 'my-import',
          key: '1'
        });
        expect(swg.identifier).toEqual({
          namespace: 'my-import',
          key: '2'
        });
        expect(clock.identifier).toEqual({
          namespace: 'my-import',
          key: '3'
        });
      });

      it('have remapped identifiers in composition', function () {
        expect(layout.composition).toContain({
          namespace: 'my-import',
          key: '2'
        });
        expect(layout.composition).toContain({
          namespace: 'my-import',
          key: '3'
        });
      });

      it('layout has remapped identifiers in configuration', function () {
        const identifiers = layout.configuration.items
          .map((item) => item.identifier)
          .filter((identifier) => identifier !== undefined);
        expect(identifiers).toContain({
          namespace: 'my-import',
          key: '2'
        });
        expect(identifiers).toContain({
          namespace: 'my-import',
          key: '3'
        });
      });

      it('rewrites locations', function () {
        expect(folder.location).toBe('ROOT');
        expect(swg.location).toBe('my-import:root');
        expect(layout.location).toBe('my-import:root');
        expect(clock.location).toBe('my-import:root');
      });
    });
  });
});
