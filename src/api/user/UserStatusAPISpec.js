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

import { createOpenMct, resetApplicationState } from '../../utils/testing';

describe('The User Status API', () => {
  let openmct;
  let userProvider;
  let mockUser;

  beforeEach(() => {
    userProvider = jasmine.createSpyObj('userProvider', [
      'setPollQuestion',
      'getPollQuestion',
      'getCurrentUser',
      'getPossibleRoles',
      'getPossibleStatuses',
      'getAllStatusRoles',
      'canSetPollQuestion',
      'isLoggedIn',
      'on'
    ]);
    openmct = createOpenMct();
    mockUser = new openmct.user.User('test-user', 'A test user');
    userProvider.getCurrentUser.and.returnValue(Promise.resolve(mockUser));
    userProvider.getPossibleStatuses.and.returnValue(Promise.resolve([]));
    userProvider.getPossibleRoles.and.returnValue(Promise.resolve([]));
    userProvider.getAllStatusRoles.and.returnValue(Promise.resolve([]));
    userProvider.canSetPollQuestion.and.returnValue(Promise.resolve(false));
    userProvider.isLoggedIn.and.returnValue(true);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the poll question', () => {
    it('can be set via a user status provider if supported', () => {
      openmct.user.setProvider(userProvider);
      userProvider.canSetPollQuestion.and.returnValue(Promise.resolve(true));

      return openmct.user.status.setPollQuestion('This is a poll question').then(() => {
        expect(userProvider.setPollQuestion).toHaveBeenCalledWith('This is a poll question');
      });
    });
    // fit('emits an event when the poll question changes', () => {
    //     const pollQuestionChangeCallback = jasmine.createSpy('pollQuestionChangeCallback');
    //     let pollQuestionListener;

    //     userProvider.canSetPollQuestion.and.returnValue(Promise.resolve(true));
    //     userProvider.on.and.callFake((eventName, listener) => {
    //         if (eventName === 'pollQuestionChange') {
    //             pollQuestionListener = listener;
    //         }
    //     });

    //     openmct.user.on('pollQuestionChange', pollQuestionChangeCallback);

    //     openmct.user.setProvider(userProvider);

    //     return openmct.user.status.setPollQuestion('This is a poll question').then(() => {
    //         expect(pollQuestionListener).toBeDefined();
    //         pollQuestionListener();
    //         expect(pollQuestionChangeCallback).toHaveBeenCalled();

    //         const pollQuestion = pollQuestionChangeCallback.calls.mostRecent().args[0];
    //         expect(pollQuestion.question).toBe('This is a poll question');

    //         openmct.user.off('pollQuestionChange', pollQuestionChangeCallback);
    //     });
    // });
    it('cannot be set if the user is not permitted', () => {
      openmct.user.setProvider(userProvider);
      userProvider.canSetPollQuestion.and.returnValue(Promise.resolve(false));

      return openmct.user.status
        .setPollQuestion('This is a poll question')
        .catch((error) => {
          expect(error).toBeInstanceOf(Error);
        })
        .finally(() => {
          expect(userProvider.setPollQuestion).not.toHaveBeenCalled();
        });
    });
  });
});
