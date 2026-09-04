/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
 *****************************************************************************/

import { getValidatedData, getValidatedGroups } from './util.js';

describe('plan util sourceMap guards (#8428)', () => {
  it('getValidatedData returns an empty plan when activities key is missing', () => {
    const domainObject = {
      sourceMap: {
        activities: 'missing-key',
        groupId: 'group'
      },
      selectFile: {
        body: {
          items: [{ group: 'a' }]
        }
      }
    };

    let result;
    expect(() => {
      result = getValidatedData(domainObject);
    }).not.toThrow();
    expect(result).toEqual({});
  });

  it('getValidatedData still maps valid data', () => {
    const domainObject = {
      sourceMap: {
        activities: 'items',
        groupId: 'group'
      },
      selectFile: {
        body: {
          items: [{ group: 'a' }, { group: 'b' }]
        }
      }
    };

    expect(getValidatedData(domainObject)).toEqual({
      a: [{ group: 'a' }],
      b: [{ group: 'b' }]
    });
  });

  it('getValidatedGroups falls back to plan-data keys when orderedGroups key is missing', () => {
    const domainObject = {
      sourceMap: {
        orderedGroups: 'missing-groups'
      },
      selectFile: {
        body: {}
      }
    };

    let result;
    expect(() => {
      result = getValidatedGroups(domainObject, { a: [], b: [] });
    }).not.toThrow();
    expect(result).toEqual(['a', 'b']);
  });
});
