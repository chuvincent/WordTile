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

var GameFacebook = {
	waitTimeBeforeAutoNudge: 60,//in minutes
	
	sendRequestViaFriendSelector: function(theGameId, theLanguage, directURL, callback) {
	  if (!callback){
		callback = GameFacebook.sendRequestResponse;  
	  }
	  return function(){
		FB.ui({method: 'apprequests',
		  message: 'Join my Word Tile game!',
		  data: {gameId: theGameId, language: theLanguage},
		  max_recipients: 1
		  //redirect_uri: directURL
		}, callback);
	  };
	},
	
	sendRequest: function(theGameId, theLanguage, targetFbUserId, message, callback){
		GameHelper.assert(targetFbUserId != "", "targetFbUserId is null");
		GameFacebook.performIfLoggedIn(function(){
			if (!callback){
			  callback = GameFacebook.sendRequestResponse;  
			}
			FB.ui({method: 'apprequests',
			  message: message,
			  to: targetFbUserId,
			  data: {gameId: theGameId, language: theLanguage},
			  max_recipients: 1
			  //redirect_uri: directURL
			}, callback);
		});
	},
	
	isRequestProbablyFromFacebook: function() {
		var fbRequestType = $.url().param('app_request_type');
		var fbRequestId = $.url().param('request_ids');
		return (fbRequestType == "user_to_user" && fbRequestId);
	},
	
	ensureLoggedIn: function(loggedInCallback) {
		FB.login(function(response) {
		  if (response.authResponse) {
			  if (loggedInCallback)
			  	var uid = response.authResponse.userID;
				var accessToken = response.authResponse.accessToken;
			 	loggedInCallback(uid, accessToken);
		   } else {
			 GameHelper.consoleLog('FB Login failed');
			 loggedInCallback(null, null);
		   }	
		});
	},
	
	isLoggedIn: function(callback){
		try{
			FB.getLoginStatus(function(response){
				if (response.status === 'connected') {
					callback(true);
				}
				else{
					callback(false);
				}
			});
		}
		catch(error){
			callback(false);
		}
	},
	
	performIfLoggedIn: function(loggedInCallback){
		try{
			FB.getLoginStatus(function(response) {
				if (response.status === 'connected') {
				  // user is logged into facebook and authorized the app
				  var uid = response.authResponse.userID;
				  var accessToken = response.authResponse.accessToken;
				  if (loggedInCallback){
					  loggedInCallback(uid, accessToken);
				  }
				} 
				else if (response.status === 'not_authorized') {
				  // the user is logged in to Facebook, but has not authorized the app
				  GameFacebook.ensureLoggedIn(loggedInCallback);
				} 
		   });
		}
		catch(error){
			GameHelper.consoleLog('Error in GameFacebook.performIfLoggedIn');
		}
	},
	
	deleteRequest: function(requestId) {
	  FB.api(requestId, 'delete', function(response) {
		GameHelper.consoleLog(response);
	  });
	},
	
	getGameIdFromGameRequest: function(responseCallback) {
		var fbRequestType = $.url().param('app_request_type');
		var fbRequestIds = $.url().param('request_ids');
		var fbRequestIdsArray = fbRequestIds.split(',');
		var fbRequestId = fbRequestIdsArray[fbRequestIdsArray.length - 1];
		if (fbRequestType == "user_to_user" && fbRequestId)
		{		
		 	var getRequestObjectFcn = function(uid, accessToken) {
			  if (accessToken == null){
				  responseCallback(null, null);
				  return;
			  }
			  FB.api(fbRequestId, function(response) {
				GameHelper.consoleLog(response);
				if (response.data){
				  var data = JSON.parse(response.data);
				  var sentId = data.gameId;
				  var sentLanguage = data.language;
				  if (fbRequestIdsArray.length > 1)
				  {
					  GameFacebook.deleteRequest(fbRequestIdsArray[0]);
				  }
				  if (sentId){
					  GameHelper.consoleLog("sentId: " + sentId + " sentLanguage: " + sentId);
					  responseCallback(sentId, sentLanguage);
				  }
				}
				else
				{
				   GameHelper.consoleLog('Error occurred in getGameIdFromGameRequest');
				   responseCallback(null, null);
				}
			  });
			};
			GameHelper.consoleLog('Ensure login');
			GameFacebook.ensureLoggedIn(getRequestObjectFcn);	
								
		}		
	},
	
	sendRequestResponse: function(response){
		GameHelper.consoleLog(response);	
	},
	
	// Cached facebook user object: https://developers.facebook.com/docs/reference/api/user/
	user: null,
	
	queryUsername: function(callback){
		//GameHelper.consoleLog('getUsername');
		if (GameFacebook.user){
			// return cached value
			callback(GameFacebook.user.username, GameFacebook.user.id);
		}
		else{
			// query facebook
			FB.getLoginStatus(function(response) {
			  if (response.authResponse) {
				token = response.authResponse.accessToken;
				FB.api('/me', function(response) {
					//GameHelper.consoleLog('Me response');
					//GameHelper.consoleLog(response);
					GameFacebook.user = response;
					callback(GameFacebook.user.username, GameFacebook.user.id);
				});
			  }
			});
		}
	}
};

$(document).ready(function () {
	FB.init({
  		appId  : 'FACEBOOK_APPID_CHANGE_THIS',
  		frictionlessRequests: true
	});
	//GameFacebook.performIfLoggedIn(function(uid, accessToken){ GameHelper.consoleLog("LoggedIn: "+uid); });
});
	
