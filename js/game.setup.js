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

(function(){
	var DEBUG = GameHelper.DEBUG; // debug mode: use offline test values instead of hitting the server
	var FACEBOOK_APP_ID = 'WordTile';
	var consoleLog = GameHelper.consoleLog;
	var StateEnum = { 
		INITIAL: 0
		, GAMEID_INITIAL: 1 // Game room created.  Not log in yet
		, GAME_WAIT: 2 // Logged in.  Waiting for other player prompt
		, GAME_WAIT_POLL: 3 // Logged in.  Polling for other player
		, GAME_READY: 4 // Everyone is here.  Let's play
		, GAMEFACEBOOK_INITIAL: 5 // Request from facebook.  Required facebook login
	};
	var mSetupState = StateEnum.INITIAL;
	var gameId = $.url().param('gameId');
	var language = $.url().param('language');
	
	/////////  String table
	var SETUP_STRINGS = {
		// dialog popup strings
		InitialHeader: "Welcome.  You're not in a game room yet!"
		, InitialBody: "<p>Two players battle for victory in a game room. <br/>Go to a game room now.</p>"
		, InitialButton: "Go to Game Room"
		, FacebookRequiredHeader: "Welcome.  Facebook connection is required."
		, FacebookRequiredBody: "To access the game request you have received, you must log in to Facebook."
		, FacebookRequiredButton: "Connect with Facebook"
		, GameIdInitialHeader : "No one here yet!"
		, GameIdInitialBody : "<p>This game room is free are right now, let's get started!</p>You may use different names in different rooms, the password is just to prevent your opponent from signing in as you.</p>"
		, GameIdInitialButton: "Create game"
		, GameIdInitial1PlayerHeader : "Join now!"
		, GameIdInitial1PlayerBody : "<p>This game room has one player (PLAYERNAME) right now.<br/>Join as a second player or sign in as PLAYERNAME</p>"
		, GameIdInitial1PlayerButton: "Join game"
		, GameIdInitial2PlayerHeader : "Join now!"
		, GameIdInitial2PlayerBody : "<p>This game room has two player (PLAYER1NAME and PLAYER2NAME) right now.<br/>Sign in  now as PLAYER1NAME or PLAYER2NAME</p>"
		, GameIdInitial2PlayerButton: "Join game"
		, GameWaitHeader : "Ask your friend to join!"
		, GameWaitBody : "<p>Hello PLAYER1NAME. It's easy to ask your friend to join this game:</p>"
		, GameWaitButton: "OK!"
		, ErrorHeader: "Oops!"
		, ErrorTooManyPlayersBody: "There are two players already.  Sorry!<br/>(Did you try to sign in with an incorrect nickname?)"
		, ErrorPasswordIncorrectBody: "Password incorrect or name already taken.<br/>Try again?"
		
		//feedback strings
		, CannotBePrivacyMode: "The game does not function in privacy mode."
		, FbAssignedGameRoom: "A game room is assigned when you are logged in to Facebook."
		, EnterNewRoomName: "Please enter a game room name"
		, FbStartGame: "Start Game with Facebook"
	};
	
	/////////  helper functions
	
	function stringLookup(stringIdentifier, parameters){
		var theString = SETUP_STRINGS[stringIdentifier];
		for (var k in parameters){
			theString = theString.replace(new RegExp(k, 'g'), parameters[k]);
		}
		return theString;
	}
	
	function displayModal(header, messageHTML, formToShow, dismissLabel, dismissCallback){
		$('#setupModal').modal({keyboard: false, backdrop: 'static'});
		if (DEBUG)
			messageHTML = "<p>DEBUG current state: "+ mSetupState + "</p>" + messageHTML;
		$('#setupModalLabel').text(header);
		$('#setupModalBodyText').fadeIn();
		$('#setupModalBodyText').html(messageHTML);	
		$('#setupModalBody form').hide();
		if (formToShow)
			$(formToShow).show();	
		//$("#setupModalPrimary span").text(dismissLabel);
		//$("#setupModalPrimary span").text("dadafd");
		$("#setupModalPrimary").html(dismissLabel);
		$('#setupModalPrimary').unbind("click").click(function(){
			//$('#setupModal').modal('hide');
			dismissCallback();
		});
		$("#setupModalStart").show();
		$(formToShow).submit(function(e) {
		  //e.preventDefault();
		  dismissCallback();
		  return false;
		});
	}
	
	function gotoGameRoom(gameId, language){
		if (gameId && language)
			window.location = "index.html?gameId="+encodeURIComponent(gameId)+"&language="+language;
		else
			window.location = "index.html";
	}
	
	///////// ajax functions
	
	var queryBoardTransaction = GameHelper.queryBoardTransaction;
	
	function queryBoard(gameId, callback){
		if (!DEBUG){
		  $.post("ws/queryBoard.php", { "gameId": gameId },
			function(data){
				//GameStorage.storeBoardInfo(gameId, data); //done in caller
				consoleLog(data);
				callback(data);
			}, "json").fail(function(){ consoleLog("Fail queryboard");callback({}); });
		}
		else
		{
			//DEBUG
			callback(GameHelper.DEBUG_DB);
			//callback({"uncommon_reb":[],"orderedTiles":"ねぎおたすょんるつっいくっんとひんいゅいんけらっご"});
		}
	}
	
	function queryGameId(gameId, callback){
		if (!DEBUG){
		  $.post("ws/queryGameId.php", { "gameId": gameId },
			function(data){
			  //console.log(data.numPlayers);
			  //console.log(data.gameId);
			  callback(data.numPlayers, data.players);
			}, "json");
		}
		else
		{
			var numPlayers = 1;
			var players = [{username: "PH", fbUserId: -1}];
			callback(numPlayers, players);
		}		
	}
	
	function queryGamesByFbId(fbId, callback){
		if (!DEBUG){
		  $.post("ws/queryGamesByFbId.php", { "fbId": fbId },
			function(data){
			  //console.log(data);
			  callback(data);
			}, "json");
		}
		else
		{
			callback({'Test0':[VC,PH]});
			//callback(numPlayers, players);
		}		
	}
	
	function createUsername(gameId, username, password, fbUserId, callback){
		if (!DEBUG){
		  if (!language) {
			  language = 'jp';
		  }
		  $.post("ws/createUser.php", { "gameId": gameId, "username":username, "password":password, "language":language, 'fbUserId': fbUserId },
			function(data){
			  //console.log(data.numPlayers);
			  //console.log(data.gameId);
			  consoleLog(data);
			  callback(data);
			}, "json");
		}
		else
		{
			consoleLog("DEBUG createUsername callback");
			var data = {success: 1, playerId: 1};
			//var data = {error: 'ErrorTooManyPlayersBody'};
			//var data = {error: 'ErrorPasswordIncorrectBody'};
			callback(data);
		}			
	}
	
	
	///////// handle tiles
	
	function clearOwnershipArray(){
		var GRIDWIDTH = $("#gamegrid").data("gridWidth");
		var GRIDHEIGHT = $("#gamegrid").data("gridHeight");
		var blankOwnershipArray = []
		for (var i=0;i<GRIDWIDTH*GRIDHEIGHT; i++){
			blankOwnershipArray[i] = 'b';
		}
		GameStorage.ownershipArray = blankOwnershipArray;
		if (DEBUG){
		  GameStorage.ownershipArray = [
			  'p','p','p','p','p',
			  'b','p','o','p','p',
			  'b','o','o','o','p',
			  'p','p','o','p','p',
			  'o','p','p','p','p'
		];	
		}
	}
	
	
	// Retrieve tiles from server if not in storage.  Display the tiles
	function displayTiles(readyCallback){
		// this should be called only on states on or after GAME_WAIT
		if (!$( "#gamegrid" ).data("isTilesDisplayed")){
		  var tilesReadyToDisplayCallback = function(data){
			  var orderedTiles = data.orderedTiles;
			  $(".boardtile").trigger("upateTileCharacter",[orderedTiles]);
			  $(".boardtile").trigger("colorBaseOnOwnership",[GameStorage.ownershipArray]);
			  GameHelper.updateScores(gameId, language);
			  $( "#gamegrid" ).data("isTilesDisplayed", 1);  //indicate tiles are displayed now
		  };
		 
		  if (GameStorage.hasBoardInfo(gameId)){
			  var storedData = GameStorage.getBoardInfo(gameId);
			  tilesReadyToDisplayCallback(storedData);				  
			  if (readyCallback)
				  readyCallback();
		  }
		  else{
			  queryBoard(gameId, function(data){
				  GameStorage.storeBoardInfo(gameId, data);
				  tilesReadyToDisplayCallback(data);			  
				  if (readyCallback)
					  readyCallback();
			  });
		  }
		}
		else {
			if (readyCallback)
				readyCallback();
		}
	}
	
	function finishSetup(readyCallback){		
		var queryBoardTransactionCallback = function(data){
			if (data.success){
			  GameStorage.storeBoardTransact(gameId, data);
			  var serverOwnershipArray = data["ownershipArray"];
			  if (serverOwnershipArray){
				  GameHelper.assert( mSetupState != StateEnum.GAME_WAIT, "Has ownership array from server but there's only one player");
				  var localOwnershipArray = GameHelper.translateToClientOwnershipArray(gameId, serverOwnershipArray);
				  GameStorage.ownershipArray = localOwnershipArray;
			  }
			  var isPlayerTurn = GameHelper.isPlayerTurn(gameId, data["submissionBy"]);
			  GameHelper.indicateTurn(isPlayerTurn);
			  displayTiles(readyCallback);
			}
			else{
				GameHelper.alert("Fail to retrieve board transactions");
			}
		};
		queryBoardTransaction(gameId, queryBoardTransactionCallback);
	}
	
	///////// state handling
	
	// There should be a game Id, but we don't know who the user is
	function handleGameIdInitialState(){
		GameFacebook.queryUsername(function(fbUsername, fbuserid){
		  if (fbUsername){
			  consoleLog(fbUsername);
			  $("#inputUsername").val(fbUsername);
		  }
		  if (fbuserid){
			  consoleLog(fbuserid);
			  $("#inputFbUserid").val(fbuserid);
		  }
		});
		var postQueryGameIdFunc = function(numPlayers, players){
			consoleLog('Server: Number of players in room: '+numPlayers);
			consoleLog('Server Players: '+players);
			var createJoinCallback = function () {
					var desiredUsername = $("#inputUsername").val();
					var desiredPassword = $("#inputPassword").val();
					var fbUserId = $("#inputFbUserid").val();
					if (desiredUsername.length == 0) {
						$("#inputUsername").tooltip({title: "Please enter a username", placement: 'bottom'});
						$("#inputUsername").tooltip('show');
						return;
					}
					if (!GameStorage.testStorage()){
						$("#setupModalPrimary").tooltip({title: SETUP_STRINGS['CannotBePrivacyMode'], placement: 'top'});
						$("#setupModalPrimary").tooltip('show');
						return;
					}
					$("#setupModalPrimary").tooltip('destroy');
					var serverCallback = function (data) {
						if (data.success == 1){
							mSetupState = StateEnum.GAME_WAIT;
							var permanent = $("#inputRemberLogin").is(':checked');
							GameStorage.storePlayerInfo(gameId, desiredUsername, data.playerId, permanent);
							processState();
						}
						else {
							displayModal(SETUP_STRINGS["ErrorHeader"]
							, SETUP_STRINGS[data.error]
							, "#setupSignUpForm"
							, "Join Game"
							, createJoinCallback);	
						}
						consoleLog(data);
					}; // end serverCallback.  Server reply for create user
					createUsername(gameId, desiredUsername, desiredPassword, fbUserId, serverCallback);
			}; // end createJoinCallback.  User initiated
			switch(numPlayers)
			{
			  case 0:
				//create game / create login
				displayModal(SETUP_STRINGS["GameIdInitialHeader"]
							, SETUP_STRINGS["GameIdInitialBody"]
							, "#setupSignUpForm"
							, SETUP_STRINGS["GameIdInitialButton"]
							, createJoinCallback);
				break;
			  case 1:
				//create login / log in
				displayModal(SETUP_STRINGS["GameIdInitial1PlayerHeader"]
							, stringLookup("GameIdInitial1PlayerBody", {'PLAYERNAME': players[0]['username']})
							, "#setupSignUpForm"
							, SETUP_STRINGS["GameIdInitial1PlayerButton"]
							, createJoinCallback);
				break;
			  case 2:
				// need to log in	
				 displayModal(SETUP_STRINGS["GameIdInitial2PlayerHeader"]
							, stringLookup("GameIdInitial2PlayerBody", {'PLAYER1NAME': players[0]['username'], 'PLAYER2NAME': players[1]['username']})
							, "#setupSignUpForm"
							, SETUP_STRINGS["GameIdInitial2PlayerButton"]
							, createJoinCallback);
				break;
			  default:
				//code to be executed if n is different from case 1 and 2
			  }
		}; //end postQueryGameIdFunc
		queryGameId(gameId, postQueryGameIdFunc);		
	}
	
	// probably in index.html.  We don't know what the game id is
	function handleInitialState(){
		$('#inputGameIdDropdown').hide();
		$('#inputGameId').show();
		// not a request from facebook, but maybe the user is already logged on to facebook
		var ifLoggedInCallback = function(uid, accessToken){
			// Generate new game room name
			var guid = GameHelper.getGuid();
			$('#inputGameId').val(guid);
			$('#inputGameId').attr("readonly", true);
			$("#inputGameId, #inputGameIdDropdown").tooltip({title: SETUP_STRINGS['FbAssignedGameRoom'], placement: 'bottom'});
			// Note that change listener on #inputGameIdDropdown would automatically 
			// propagate user selected value to #inputGameId in the future
			$('<option>').val(guid).text(SETUP_STRINGS['FbStartGame']).appendTo('#inputGameIdDropdown');
			
			$('#inputGameIdDropdown').show();
			$('#inputGameId').hide();
			
			var queryGamesByFbIdCallback = function(pastGamesObj){
				//{gameId: [player0, player1]}
				var pastGames = pastGamesObj.games;
				for (var pastGameId in pastGames){
					var pastGamePlayers = pastGames[pastGameId];
					var player1 = pastGamePlayers[0];
					var player2 = pastGamePlayers.length == 2 ? pastGamePlayers[1] : '???';
					var vsString = player1 + " vs. " + player2 + " ("+pastGameId+")";
					$('<option>').val(pastGameId).text(vsString).appendTo('#inputGameIdDropdown');
				}
			};
			// Populate past game rooms
			queryGamesByFbId(uid, queryGamesByFbIdCallback);
		};
		GameFacebook.performIfLoggedIn(ifLoggedInCallback);
		// not a facebook request and no gameId is specified.  Ask user for one.
		var callback = function() {
			//This is a special case, we actually go somewhere else
			var desiredGameId = $("#inputGameId").val();
			if (desiredGameId.length == 0) {
				$("#inputGameId").tooltip({title: SETUP_STRINGS['EnterNewRoomName'], placement: 'bottom'});
				$("#inputGameId").tooltip('show');
				return;
			}
			var desiredGameLanguage = $("#inputGameLanguage").val();
			
			gotoGameRoom(desiredGameId, desiredGameLanguage);
			//mSetupState = StateEnum.GAMEID_INITIAL;
			//processState();
		};
		displayModal(SETUP_STRINGS["InitialHeader"]
						, SETUP_STRINGS["InitialBody"]
						, "#setupGameIdForm"
						, SETUP_STRINGS["InitialButton"]
						, callback);
		$("#setupModalStart").hide();
	}
	
	function updatePlayerNames(players){
		consoleLog('There are '+players.length+" players");
		var playerName = GameStorage.getPlayerName(gameId);
		var opponentName = null;
		for (var k in players) {
			if (playerName != players[k]['username']){
				opponentName = players[k]['username'];
				GameStorage.storeOpponentFbId( players[k]['fbUserId'] );
				break;
			}
		}
		$("#playerName").html("<i id=\"playerturn\" class=\"icon-bookmark\"></i>"+playerName);
		$('#playerturn').tooltip({title: "Your turn", placement: 'right'});
		$("#playerName").data('val', playerName);
		if (opponentName){
		  $("#opponentName").html("<i id=\"opponentturn\" class=\"icon-bookmark\"></i>"+opponentName);
		  $("#opponentName").data('val', opponentName);
		}	
	}
	
	function handleGameWaitState(){
		var postQueryGameIdFunc = function(numPlayers, players){
			updatePlayerNames(players);
			if (numPlayers == 2){
				mSetupState = StateEnum.GAME_READY;	
				processState();
			}
			else {
				$('#inputGameURL').val(window.location.href);
				GameHelper.selectOnFocus('#inputGameURL');
				var fbRequestSentCallback = function(response){
					consoleLog(response);
					$('#inputGameFacebook').tooltip({title: "A request has been sent.", placement: 'bottom'});
					$('#inputGameFacebook').tooltip('show');
				};
				var onClickFcn = GameFacebook.sendRequestViaFriendSelector(gameId, language, window.location.href, fbRequestSentCallback);
				$('#inputGameFacebook').click( onClickFcn );
				displayModal(SETUP_STRINGS["GameWaitHeader"]
							, stringLookup("GameWaitBody", { 'PLAYER1NAME': GameStorage.getPlayerName(gameId) })
							, "#setupGameShare"
							, SETUP_STRINGS["GameWaitButton"]
							, function() { $('#setupModal').modal('hide'); } );
				mSetupState = StateEnum.GAME_WAIT_POLL;
				processState();
			}
		};
		queryGameId(gameId, postQueryGameIdFunc);	
	}
	
	function handleGameWaitPollState(){
		// TODO: poll and transition to GAME_READY when another player joins
		var waitPollCallback = function(){
		  var postQueryGameIdFunc = function(numPlayers, players){
			  updatePlayerNames(players);
			  if (numPlayers == 2){
				  GameIdle.clearCallbacks();
				  mSetupState = StateEnum.GAME_READY;	
				  processState();
			  }
		  };
		  queryGameId(gameId, postQueryGameIdFunc);
		};
		GameIdle.addCallback(waitPollCallback);
	}
	
	function handleGameFacebookInitState(){
		var gameIdCallback = function(requestedGameId, requestedGameLanguage){
			GameHelper.consoleLog('About to go to room');
			if (requestedGameId != null){
				gotoGameRoom(requestedGameId, requestedGameLanguage);
			}
			else{
				$("#setupModalPrimary").tooltip({title: "Facebook login failed. Try again to access your game request", placement: 'top'});	
				$("#setupModalPrimary").tooltip('show');
			}
		};
		// attempt to grab request without user's action.  This might be blocked by popups blocker
		GameFacebook.getGameIdFromGameRequest(gameIdCallback);
		// hide the secondary button as the primary button does the same	
		$('#setupModalFacebook').hide(); 
		// display modal dialog asking user to log in to fb. 
		var connectFacebookCallback = function(){
			GameFacebook.getGameIdFromGameRequest(gameIdCallback);
		};
		displayModal(SETUP_STRINGS["FacebookRequiredHeader"]
						, SETUP_STRINGS["FacebookRequiredBody"]
						, null
						, SETUP_STRINGS["FacebookRequiredButton"]
						, connectFacebookCallback);		
	}
	
	function processState(){
		consoleLog("Setup state: " + mSetupState);
		switch(mSetupState){
			case StateEnum.INITIAL: {
				if (gameId) {
					// gameId is defined
					mSetupState = StateEnum.GAMEID_INITIAL;
					processState();
				}
				else {
					// gameId is not defined, but maybe it's a invite request through facebook:
					if (GameFacebook.isRequestProbablyFromFacebook()) {
						mSetupState = StateEnum.GAMEFACEBOOK_INITIAL;
						processState();
					}
					else {
						handleInitialState();
					}
				}
			}
			break;
			case StateEnum.GAMEID_INITIAL: {
				if (GameStorage.getPlayerId(gameId)){
					mSetupState = StateEnum.GAME_WAIT;
					processState();
				}
				else {
					handleGameIdInitialState();
				}
			}
			break;	
			case StateEnum.GAME_WAIT: {
				consoleLog("You're logged in as "+GameStorage.getPlayerName(gameId)+" with player id "+GameStorage.getPlayerId(gameId));
				handleGameWaitState();
				finishSetup(null);
			}
			break;
			case StateEnum.GAME_WAIT_POLL: {
				handleGameWaitPollState();
			}
			break;
			case StateEnum.GAME_READY: {
				$('#setupModal').modal('hide');
				var readyCallback = function(){
					$("#gamegrid").trigger("setupFinished");
					consoleLog("You're logged in as "+GameStorage.getPlayerName(gameId)+" with player id "+GameStorage.getPlayerId(gameId));
					consoleLog("Game Ready!");
				};
				finishSetup(readyCallback);
			}
			break;
			case StateEnum.GAMEFACEBOOK_INITIAL: {
				handleGameFacebookInitState();
			}
			break;
		}
	}
	
	
	$(document).ready(function () {
		clearOwnershipArray();
		processState();
		$("#setupModalStart").click(function(){
			window.location = "index.html";
		});
		
		// show connect with facebook button if user has not logged in / authorized app
		$('#setupModalFacebook').hide();
		GameFacebook.isLoggedIn(function(isLoggedIn){
			if (!isLoggedIn){
				// it is not the case that user is logged in to facebook and already authorized app.
				$('#setupModalFacebook').click(function(){
					var loggedInCallback = function(uid, accessToken){
						if (accessToken != null){
							// user successfully logged in
							$('#setupModalFacebook').hide();
							processState();
						}
					};
					GameFacebook.ensureLoggedIn(loggedInCallback);
				}); //end .click()
				// no need to show button if in GAMEFACEBOOK_INITIAL.  Same as primary button
				if (mSetupState != StateEnum.GAMEFACEBOOK_INITIAL){
					$('#setupModalFacebook').show();
				}
			} // end if (!isLoggedIn)
		});
		
		$('#inputGameIdDropdown').change(function() {
  				var selectedGameRoom = $("#inputGameIdDropdown").val();
				$('#inputGameId').val(selectedGameRoom);
		});
	}); // end ready()
	 
})();