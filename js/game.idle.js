// Copyright 2013 - Vincent Chu (chuvincent (at) gmail.com)

/*
The MIT License (MIT)

Copyright (c) 2013 Vincent Chu.  chuvincent@gmail.com.  http://www.vincentchu.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var GameIdle = (function(){
	///////Constants
	var StateEnum = { 
		FAST_UPDATE: 0
		, SLOW_UPDATE: 1
		, NO_UPDATE: 2
	};
	var self = {};
	
	self.MIN_FOCUS_EXECUTE_INTERVAL = 15 * 1000;
	MIN_FOCUS_EXECUTE_INTERVAL = self.MIN_FOCUS_EXECUTE_INTERVAL;
	var MAX_FOCUS_EXECUTE_INTERVAL = 1.5 * 60 * 1000;
	var IDLE_EXECUTE_INTERVAL = 1.5 * 60 * 1000;
	var NO_UPDATE_THRESHOLD = 10 * 60 * 1000;
	var LONG_IDLE_HEADER = "Still there?";
	var LONG_IDLE_BODY = "Let's resume our game.";
	
	
	var gameId = $.url().param('gameId');
	var mIdleState = StateEnum.FAST_UPDATE;
	var mIsWindowActive = true;
	var mIdleTime = 0; // how long has the user idled
	var mIsGameActive = false;

	var mNextExecuteTime = MIN_FOCUS_EXECUTE_INTERVAL;

	var mNextExecuteTimeoutVar = -1;
	var mCallbacks = [];
	
	var DEBUG = GameHelper.DEBUG;
	
	///////// helper functions
	var consoleLog = GameHelper.consoleLog;  


    ///////// public functions
	self.indicateGameActive = function(){
		consoleLog('indicateGameActive');
		mIsGameActive = true;
		wokeUp();
		
	};
	
	self.addCallback = function(callback){
		mCallbacks.push(callback);
	};
	
	self.clearCallbacks = function(){
		mCallbacks = [];	
	}
	
	self.clearTimer = function(){
		clearTimeout(mNextExecuteTimeoutVar);
		mNextExecuteTime = MIN_FOCUS_EXECUTE_INTERVAL;
		mNextExecuteTimeoutVar = setTimeout(processState, MIN_FOCUS_EXECUTE_INTERVAL);
	}
	 
   ///// functions for detecting user focus / wake ups
   	 function init(){
		 checkTime();
		 $('.boardtile, #playerName, #opponentName').live('click', function(event){ 
		 	if (mIdleState == StateEnum.FAST_UPDATE){
		 		wokeUp();
		 	}
		 });
		 mNextExecuteTimeoutVar = setTimeout(processState, getNextExecuteTime());
	 }
	 
	 function getNextExecuteTime(){
		var tmp =  mNextExecuteTime;
		mNextExecuteTime = Math.min(MAX_FOCUS_EXECUTE_INTERVAL, mNextExecuteTime * 1.2);	
		return tmp;
	 }
   
	 function wokeUp(){
		consoleLog("Focus");
		mNextExecuteTime = MIN_FOCUS_EXECUTE_INTERVAL;
		mIsWindowActive = true;
		//clearTimeout(mNextExecuteTimeoutVar);
		processState(); 
	 }
	 
	 function transitionState(){
		 var isPlayerTurn = GameHelper.isPlayerTurn(gameId, GameStorage.getBoardTransact(gameId)["submissionBy"]);
		 if (mIsWindowActive){
			 if (isPlayerTurn && mIsGameActive){
			 	mIdleState = StateEnum.SLOW_UPDATE;
		 	 }
			 else
			 {
				 mIdleState = StateEnum.FAST_UPDATE;
			 }
		 }
		 else
		 {
			 if (mIdleTime > NO_UPDATE_THRESHOLD){
				 mIdleState = StateEnum.NO_UPDATE;
			 }
			 else{
			 	mIdleState = StateEnum.SLOW_UPDATE;
			 }
		 }
	 }
	 
	 function processState(){
		for (var k in mCallbacks){
			consoleLog('Executing callback');
			mCallbacks[k]();
		}
		consoleLog('Before: '+mIdleState+" ("+mNextExecuteTime+","+mIdleTime+")");
		transitionState();
		//idleString = idleString +"<br/>"+'After: '+GameHelper.enumToString(StateEnum, mIdleState)+" ("+mIsWindowActive+","+mNextExecuteTime+","+mIdleTime+")";

		consoleLog('After: '+mIdleState+" ("+mNextExecuteTime+","+mIdleTime+")");
		clearTimeout(mNextExecuteTimeoutVar);
		switch (mIdleState){
			case  StateEnum.FAST_UPDATE:
			{
			  var nextTime = getNextExecuteTime();
			  consoleLog("Next execute in "+nextTime);
			  mNextExecuteTimeoutVar = setTimeout(processState, nextTime);
			  break;
			}
			case StateEnum.SLOW_UPDATE:
			{
			  consoleLog("Next execute in "+IDLE_EXECUTE_INTERVAL);
			  mNextExecuteTimeoutVar = setTimeout(processState, IDLE_EXECUTE_INTERVAL);
			  break;
			}
			case StateEnum.NO_UPDATE:
			{
				//$('#feedbackModal').modal();
				//$('#feedbackModalLabel').text(LONG_IDLE_HEADER);
				//$('#feedbackModalBodyText').html(LONG_IDLE_BODY);	
				//window.blur();
				break;
			}
		 }		 
	 }
	 
	window.onfocus = function () { 
	    wokeUp();
	}; 
	
	window.onblur = function () { 
	    consoleLog("Blur");
	    mIsWindowActive = false; 
	}; 
	
	// detect wake up in mobile browser
	var intTime = new Date().getTime();
    function checkTime() {
        var intNow = new Date().getTime();
        if (intNow - intTime > 2000) {
            wokeUp();
        }
		if (mIsWindowActive){
			// if time skewed happened, mIsGameActive would be set to active in wokeUp() above
			mIdleTime = 0;
		}
		else{
			mIdleTime += 1000; // ignore time skews
		}
		//consoleLog(mIdleTime);
        intTime = intNow;
        setTimeout(checkTime,1000);
		//var idleString = GameHelper.enumToString(StateEnum, mIdleState)+" ("+mIsWindowActive+","+mNextExecuteTime+","+mIdleTime+")";
		//$('#debugStatus').html(idleString);
    }
    
	init();
	 
	return self;
	 
})();