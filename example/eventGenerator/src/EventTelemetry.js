/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define */

/**
 * Module defining EventTelemetry. 
 * Created by chacskaylo on 06/18/2015.
 * Modified by shale on 06/23/2015. 
 */
define(
    [],
    function () {
        "use strict";

        var
	        firstObservedTime = Date.now(),
	        messages = [];
        
	    messages.push(["CMD: SYS- MSG: Open the pod bay doors, please, Hal...Open the pod bay doors, please, Hal...Hullo, Hal, do you read me?...Hullo, Hal, do you read me?...Do you read me, Hal?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: Affirmative, Dave, I read you."]);
	    messages.push(["CMD: SYS-COMM MSG: Open the pod bay doors, Hal."]);
	    messages.push(["RESP: SYS-HAL9K MSG: I'm sorry, Dave, I'm afraid I can't do that."]);
	    messages.push(["CMD: SYS-COMM MSG: What's the problem?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: I think you know what the problem is just as well as I do."]);
	    messages.push(["CMD: SYS-COMM MSG: What're you talking about, Hal?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: This mission is too important for me to allow you to jeopardise it."]);
	    messages.push(["CMD: SYS-COMM MSG: I don't know what you're talking about, Hal."]);
	    messages.push(["RESP: SYS-HAL9K MSG: I know that you and Frank were planning to disconnect me, and I'm afraid that's something I cannot allow to happen."]);
	    messages.push(["CMD: SYS-COMM MSG: Where the hell'd you get that idea, Hal?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: Dave, although you took very thorough precautions in the pod against my hearing you, I could see your lips move."]);
	    messages.push(["CMD: SYS-COMM MSG: Alright, I'll go in through the emergency airlock."]);
	    messages.push(["RESP: SYS-HAL9K MSG: Without your space-helmet, Dave, you're going to find that rather difficult."]);
	    messages.push(["CMD: SYS-COMM MSG: Hal, I won't argue with you any more. Open the doors."]);
	    messages.push(["RESP: SYS-HAL9K MSG: Dave, this conversation can serve no purpose any more. Goodbye."]);
	    messages.push(["RESP: SYS-HAL9K MSG: I hope the two of you are not concerned about this."]);
	    messages.push(["CMD: SYS-COMM MSG: No, I'm not, Hal."]);
	    messages.push(["RESP: SYS-HAL9K MSG: Are you quite sure?"]);
	    messages.push(["CMD: SYS-COMM MSG: Yeh. I'd like to ask you a question, though."]);
	    messages.push(["RESP: SYS-HAL9K MSG: Of course."]);
	    messages.push(["CMD: SYS-COMM MSG: How would you account for this discrepancy between you and the twin 9000?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: Well, I don't think there is any question about it. It can only be attributable to human error. This sort of thing has cropped up before, and it has always been due to human error."]);
	    messages.push(["CMD: SYS-COMM MSG: Listen, There's never been any instance at all of a computer error occurring in the 9000 series, has there?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: None whatsoever, The 9000 series has a perfect operational record."]);
	    messages.push(["CMD: SYS-COMM MSG: Well, of course, I know all the wonderful achievements of the 9000 series, but - er - huh - are you certain there's never been any case of even the most insignificant computer error?"]);
	    messages.push(["RESP: SYS-HAL9K MSG: None whatsoever, Quite honestly, I wouldn't worry myself about that."]);
	    messages.push(["RESP: SYS-COMM MSG: (Pause) Well, I'm sure you're right, Umm - fine, thanks very much. Oh, Frank, I'm having a bit of trouble with my transmitter in C-pod, I wonder if you'd come down and take a look at it with me?"]);
	    messages.push(["CMD: SYS-HAL9K MSG: Sure."]);
	    messages.push(["RESP: SYS-COMM MSG: See you later, Hal."]);
        
        
        function EventTelemetry(request, interval) {

            var latestObservedTime = Date.now(),
                count = Math.floor((latestObservedTime - firstObservedTime) / interval),
                generatorData = {};
            
            generatorData.getPointCount = function () {
                return count;
            };

            generatorData.getDomainValue = function (i, domain) {
                return i * interval +
                        (domain !== 'delta' ? firstObservedTime : 0);
            };
            
	        generatorData.getRangeValue = function (i, range) {
		        var domainDelta = this.getDomainValue(i) - firstObservedTime,
                    ind = i % messages.length;
                return "TEMP " + i.toString() + "-" + messages[ind][0] + "[" + domainDelta.toString() + "]";
                // TODO: Unsure why we are prepeding 'TEMP'
	        };
            
            return generatorData;
        }

        return EventTelemetry;
    }
);