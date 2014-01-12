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
	var GRIDWIDTH = $("#gamegrid").data("gridWidth");
	var GRIDHEIGHT = $("#gamegrid").data("gridHeight");
	var gameId = $.url().param('gameId');
	var language = $.url().param('language');
	
	var FEEDBACK_STRINGS = {
		WordAlreadyUsed:{ Header: "Sorry...", Body: "The word is already used!"},
		EquationAlreadyUsed: { Header: "Sorry...", Body: "This equation or a similar one is already used!"},
		WordNotInDictionary: { Header: "Sorry...", Body: "The word 'PARAM1' is not in dictionary!"},
		WordNotValidEquation: { Header: "Sorry...", Body: "Your equation is invalid!"},
		NoWord: { Header: "Make a word", Body: "Make a word by clicking the tiles or dragging the tiles into the play area."},
		OpponentTurn: { Header: "Opponent's turn", Body: ""},
		NotYourTurn: { Header: "Wait...", Body: "It's not your turn right now!"},
		GameWon: { Header: "It appears...", Body: "You've won :)! Congratulations!" + '<p>Start another game <a href="index.html">here</a>.</p>'},
		GameLost: { Header: "It appears...", Body: "You've lost :(.  Sorry!" + '<p>Start another game <a href="index.html">here</a>.</p>'},
		GameFinished: { Header: "Game Finished", Body: 'Start another game <a href="index.html">here</a>.'}
	};
	var GameStateEnum = { 
		NOT_READY: 0
		, PLAYER_TURN: 1
		, OPPONENT_TURN: 2
		, FINISHED: 3
	};
	var QueryLastTransactionStateEnum = {
		NONE: 0
		, IN_PROGRESS: 1
		, EXPIRED: 2
	};
	var mGameState = GameStateEnum.NOT_READY;
	var mQueryLastTransactionState = QueryLastTransactionStateEnum.NONE;
	
	var DEBUG = GameHelper.DEBUG;
	
	///////// helper functions
	var consoleLog = GameHelper.consoleLog;  
	var updateScores = GameHelper.updateScores;
	
	function getSubmissionWord(){
		var word = "";
		$("#divWordArea .boardtile").each(function(){
			var tile = $(this);
			var tileText = tile.clone().children().remove().end().text();
			word = word + tileText;
		});
		consoleLog(word);
		return word;
	}
	
	// functions for checking math
	
	function checkMathExpr(word){
		var equalCount = word.match(/=/g); 
		if (equalCount.length != 1){
			return null;
		}
		word = word.replace(/=/g, '==');
		word = word.replace(/x/g, '*');
		try {
			var result = eval(word);
			if (result == true)
				return word;
		}
		catch (err){
			// do nothing
		}
		return null;
	}
	
	function getCharHashMap(word){
		var map = {}
		for (var i=0; i < word.length; i++) {
			if (word[i] in map){
				map[word[i]]++;	
			}
			else
			{
				map[word[i]] = 1;
			}
		}
		return map;
	}
	
	function isEquationCoveredByOtherEquation(equation, otherEquation){
		// the equation is valid and should have exactly 1 equal sign
		// strip off one side of the equation to find out what the equation evaluates to
		consoleLog('Comparing '+equation+' with '+otherEquation);
		var result = eval(equation.substring( equation.indexOf('==') + 2 ));
		var otherResult = eval(otherEquation.substring( otherEquation.indexOf('==') + 2 ));
		consoleLog('  result: '+result+ ' otherResult: '+otherResult);
		var isResultSame = (result == otherResult);
		var equationMap = getCharHashMap(equation);
		var otherEquationMap = getCharHashMap(otherEquation);
		var equationUsedExtraTiles = false;
		for (var chark in equationMap){
			if ((equationMap[chark] > otherEquationMap[chark]) || (!otherEquationMap[chark])){
				equationUsedExtraTiles = true;
			}
		}
		consoleLog('  equationMap: '+equationMap+ ' otherEquationMap: '+otherEquationMap);
		return 	!equationUsedExtraTiles && 	isResultSame;
	}
	
	// check "word" (the new equation) against past submissions
	function isEquationUsed(word){
		var transact = GameStorage.getBoardTransact(gameId);
		var pastSubmissions = transact["allSubmissions"];
		consoleLog(pastSubmissions);
		for (var submissionk in pastSubmissions){
			if (isEquationCoveredByOtherEquation(word, pastSubmissions[submissionk]))
			{
				return true;
			}
		}
		return false;
	}
	
	// functions for checking languages
	
	function isWordInDictionary(word){
		var boardInfo = GameStorage.getBoardInfo(gameId);
		//consoleLog(boardInfo);
		var CATEGORIES = GameHelper.getWordsCategories();
		for (var catk in CATEGORIES){
			var cat = CATEGORIES[catk];
			var allowedWords = boardInfo[cat];
			if (!allowedWords) continue;
			//consoleLog(allowedWords);
			for (var allowedWordk in allowedWords){
				var dictWord = allowedWordk;
				var dictWordInHiragana = JapaneseHelper.convertToHiragana(dictWord);
				if (word == dictWordInHiragana)
					return dictWord;	
			}			
		}
		return null;
	}
	
	function isWordUsed(word){
		var transact = GameStorage.getBoardTransact(gameId);
		var pastSubmissions = transact["allSubmissions"];
		consoleLog(pastSubmissions);
		for (var submissionk in pastSubmissions){
			if (pastSubmissions[submissionk].indexOf(word) >= 0)
			{
				return true;
			}
		}
		return false;
	}
	
	function lookupDefinition(word){
		var boardInfo = GameStorage.getBoardInfo(gameId);
		//consoleLog(boardInfo);
		var CATEGORIES = GameHelper.getWordsCategories();
		for (var catk in CATEGORIES){
			var allowedWords = boardInfo[CATEGORIES[catk]];
			if (!allowedWords) continue;
			if (allowedWords[word]){
				return 	allowedWords[word];
			}
		}
		return "";
	}
	
	function getDefinitionString(word){
	    var result = lookupDefinition(word);
		var reb = result[0];
		var english = result[1];
		var definition = "";
		if (reb)
		{
			definition += " (" + reb + "), ";
		}
		if (english)
		{
			definition += english;
		}
		return definition;
	}
	
	
	///////// helper function
	function showFeedback(msgDict, optionalArgsDict)
	{
		$('#feedbackModal').modal();
		var messageHTML = msgDict["Body"];
		var msgHeader = msgDict["Header"];
		consoleLog(mGameState);
		if (DEBUG)
			messageHTML = "<p>DEBUG current state: "+ mGameState + "</p>" + messageHTML;
		if (optionalArgsDict){
			for (k in optionalArgsDict) {
				msgHeader = msgHeader.replace(k, optionalArgsDict[k]);
				messageHTML = messageHTML.replace(k, optionalArgsDict[k]);
			}
		}
		$('#feedbackModalLabel').text(msgHeader);
		$('#feedbackModalBodyText').html(messageHTML);
	}
	
	function showNudgeViaFacebook(){
		var isVisible = $('#btnNudgeViaFacebook').is(":visible");
		if (isVisible) // already visible
			return;
		var isOpponentTurn = (mGameState == GameStateEnum.OPPONENT_TURN);
		if (!isOpponentTurn)
			return;
		var isOpponentOnFacebook = GameStorage.getOpponentFbId() != "";
		if (!isOpponentOnFacebook)
			return;
		var lastKnownId = GameStorage.getLastKnownTransactionId(gameId);
		var lastNudgeUsed = GameStorage.getLastNudgeViaFacebook(gameId);
		var hasNudgeUsed = (lastNudgeUsed >= lastKnownId);
		if (hasNudgeUsed)
			return;
		$('#statusFooter').fadeIn();	
	}
	
	function attachTooltipForSubmission(submission, submissionBy){
		consoleLog(submission);
		if (submission)
		{
			var fromName = (submissionBy == GameStorage.getPlayerId(gameId)) ? $('#playerName') : $('#opponentName');
			// don't do anything if the popover has already been displayed to the user before.
			try{
			  if (fromName.data('popover').options.title == submission){
				  return false;
			  }
			}
			catch(err){
			  // pop over does not exist yet
			}
			fromName.popover('destroy');
			var definition = "";
			if (GameStorage.hasBoardInfo(gameId))
			{
			   definition = getDefinitionString(submission);
			}
			//var info = submission + definition;
			fromName.popover({title: submission
							, content:definition
							, placement: GameHelper.toolTipAutoPlacement
							, trigger: 'click' 
							});
			try{
			  $('#playerName').data('popover').tip().css('z-index', 1030);
			  $('#opponentName').data('popover').tip().css('z-index', 1030);
			}
			catch(err){
			  // pop over of the other player might not exist
			}
			fromName.data('popover').tip().css('z-index', 1031); 
			fromName.popover('show');
			setTimeout(function(){fromName.popover('hide');}, 3000);
			return true;
		}
	}
	
	function attachTooltipForAllSubmissions(transactData){
		 var delay = 0;
		 var pastSubmissions = transactData["allSubmissions"];
		 if (pastSubmissions.length >= 2){
			var secondLastSubmission =  pastSubmissions[pastSubmissions.length - 2];
			var theOtherPerson = GameHelper.getOpponentId(transactData["submissionBy"]);
			var newAttachment = attachTooltipForSubmission(secondLastSubmission, theOtherPerson);
			if (newAttachment){
			  delay = 3000;
			}
		 }
		 if (transactData != {}){
			setTimeout(function(){attachTooltipForSubmission(transactData["submission"], transactData["submissionBy"]);}, delay);		 	
		 }
	}
	
	function setStateBasedOnTurn(){
	   // do nothing if the game is already done
	   if (mGameState == GameStateEnum.FINISHED){
		   return;
	   }
		
	   var isPlayerTurn = GameHelper.isPlayerTurn(gameId, GameStorage.getBoardTransact(gameId)["submissionBy"]);
	   var oldState = mGameState;
	   
	   if (isPlayerTurn){
		   mGameState = GameStateEnum.PLAYER_TURN;
	   }
	   else {
		   mGameState = GameStateEnum.OPPONENT_TURN;
	   }
	   GameHelper.indicateTurn(mGameState == GameStateEnum.PLAYER_TURN);
	   
	   if (mGameState != oldState){
		   processState();
	   }
	}
	
	///////// ajax functions
	
	 function createBoardTransact(ownership, gameId, submission, submissionBy, clientLastSubmissionId, chat, callback){	 
		 var params = { "ownership": ownership, "gameId":gameId, "submission":submission
							, "submissionBy":submissionBy, "lastSubmissionId": clientLastSubmissionId, "chat": chat };
		consoleLog(params);
		if (!DEBUG){
		  $.post("ws/createBoardTransact.php", params,
			function(data){
			  consoleLog(data);
			  callback(data);
			}, "json").fail(function(){ consoleLog("Fail createBoardTransact"); callback({}); });
		}
		else
		{
			consoleLog("DEBUG createBoardTransact");
			var data = {success: 1, serverLastSubmissionId: 1};
			callback(data);
		}			
	}
	
	// a lighter weight version of queryBoardTransact
	function queryLastBoardTransaction(gameId, lastKnownId, callback)
	{
		GameHelper.consoleLog("queryLastBoardTransaction");
		if (!GameHelper.DEBUG){
		  $.post("ws/queryLastBoardTransact.php", { "gameId": gameId, 'lastKnownId': lastKnownId },
			function(data){
				GameHelper.consoleLog(data);
				callback(data);
			}, "json").fail(function(){ GameHelper.consoleLog("Fail queryLastBoardTransaction");callback({}); });
		}
		else
		{
			//DEBUG
		}
	}
	
	
	///////// events triggered by ui or this class
	
	 $("#gamegrid").on("setupFinished", function() {
		 // Doesn't really do much, just so we have an entry point
		 consoleLog("Control goes to game.control.js");
		 setStateBasedOnTurn();
		 var data = GameStorage.getBoardTransact(gameId);
		 attachTooltipForAllSubmissions(data);
		 GameIdle.clearCallbacks();
		 if (mGameState == GameStateEnum.FINISHED){
			 return;
		 }
		 GameIdle.indicateGameActive();
		 GameIdle.addCallback(processState);
		 GameFacebook.isLoggedIn(function(isConnected){
			 if (isConnected){
		 		GameIdle.addCallback(showNudgeViaFacebook);
				$('#btnNudgeViaFacebook').unbind("click").click(function(){
					//GameHelper.alert('About to send message to ' + GameStorage.getOpponentFbId());	
					var lastKnownId = GameStorage.getLastKnownTransactionId(gameId);
					var lastNudgeUsed = GameStorage.getLastNudgeViaFacebook(gameId);
					var hasNudgeUsed = (lastNudgeUsed >= lastKnownId);
					if (!hasNudgeUsed){
						var targetFbId = GameStorage.getOpponentFbId();
						var message = GameHelper.getTauntMessage();
						GameFacebook.sendRequest(gameId, language, targetFbId, message, null);
						GameStorage.setLastNudgeViaFacebook(gameId, GameStorage.getLastKnownTransactionId(gameId));
					}
					$('#statusFooter').fadeOut();
				});
			 }
		 });
	 });
	 
	 $("#gamegrid").on("gameFinished", function(event, winner) {
		 //TODO set star on winning player icon-star
		 /*
		   $("#playerName").html("<i id=\"playerturn\" class=\"icon-bookmark\"></i>"+playerName);
		   $("#playerName").data('val', playerName);
		  if (opponentName){
			$("#opponentName").html("<i id=\"opponentturn\" class=\"icon-bookmark\"></i>"+opponentName);
			$("#opponentName").data('val', opponentName);
		  }
		 */
		 if (winner == 'p')
		 {
			 showFeedback( FEEDBACK_STRINGS["GameWon"]);
		 }
		 else 
		 {
			 GameHelper.assert(winner == 'o', winner + " is the winner not player");
			 showFeedback( FEEDBACK_STRINGS["GameLost"]);
		 }
		 mGameState = GameStateEnum.FINISHED;
	 });
	 
	 $("#divWordArea").on("adjustScore", function() {
		var playerScore = $( "#gamegrid" ).data("playerCurrentScore");
		var opponentScore = $( "#gamegrid" ).data("opponentCurrentScore");
		$("#divWordArea .boardtile").each(function(){
			var tile = $(this);
			if (!tile.hasClass("defended"))
			{
				var itemId = tile.attr("id");
				var tileScore = 1;
				var tileScoreStr = $('#'+itemId+' .scorescript').text();
				if (tileScoreStr.length > 0)
					tileScore = parseInt(tileScoreStr);
				if (!tile.hasClass("player"))
					playerScore+= tileScore;//tile.data('score');
				if (tile.hasClass("opponent"))
					opponentScore-= tileScore;//tile.data('score');
			}
		});
		$("#playerScore").text(playerScore);
		$("#opponentScore").text(opponentScore);
	 });
	 
	  $("#divWordArea").on("claimOwnership", ".wordtile", function() {
		  var item = $(this);
		  var itemId = item.attr("id");
		  var itemX = parseInt(itemId[1]);
		  var itemY = parseInt(itemId[2]);
		  var isDefended = item.hasClass("defended");
		  if (!isDefended)
		  {
			  var index = itemY * GRIDWIDTH + itemX;
			  GameStorage.ownershipArray[index] = "p";
		  }		  
	  });
	
	// Event handlers of buttons
	
	function checkWordAllowed(word){
		if (mGameState == GameStateEnum.FINISHED){
			showFeedback( FEEDBACK_STRINGS["GameFinished"]);
			return null;
		}
		
		if (mGameState != GameStateEnum.PLAYER_TURN){
			showFeedback( FEEDBACK_STRINGS["NotYourTurn"]);
			return null;
		}
		if (word.length == 0){
			showFeedback( FEEDBACK_STRINGS["NoWord"]);
			return null;	
		}
		
		var isMath = (language == "ma");
		var dictWord = isMath ? checkMathExpr(word) : isWordInDictionary(word);
		if (dictWord == null){
			showFeedback( FEEDBACK_STRINGS[isMath ? "WordNotValidEquation" :"WordNotInDictionary"], {'PARAM1': word});
			return null;
		}
	  
	    var isUsed = isMath ? isEquationUsed(dictWord) : isWordUsed(dictWord);
		if (isUsed){
			showFeedback( isMath ? FEEDBACK_STRINGS["EquationAlreadyUsed"] : FEEDBACK_STRINGS["WordAlreadyUsed"]);
			return null;
		}
		return dictWord;
	}
	
	function submitWord(word){
		$(".wordtile").trigger("claimOwnership");
		$(".wordtile").trigger("click");
		$(".boardtile").trigger("colorBaseOnOwnership",[GameStorage.ownershipArray]);
		updateScores(gameId, language);
		var localOwnershipArray = GameStorage.ownershipArray;
		var serverOwnershipArray = GameHelper.translateToServerOwnershipArray(gameId, localOwnershipArray);
		consoleLog('submit: '+localOwnershipArray);
		consoleLog('submit: '+serverOwnershipArray);
		var playerId = GameStorage.getPlayerId(gameId);
		var lastKnownTransactionId = GameStorage.getLastKnownTransactionId(gameId);
		var createBoardTransactCallback = function (data){
			if (data.success){
				// it's now opponent's turn
				//showFeedback( FEEDBACK_STRINGS["OpponentTurn"] );
				//mState = GameStateEnum.OPPONENT_TURN;
				//GameHelper.indicateTurn(false);	
				var targetFbId = GameStorage.getOpponentFbId();
				if (targetFbId != "" && GameStorage.getTimeSinceLastKnownTransact(gameId) > GameFacebook.waitTimeBeforeAutoNudge)
				{
					var message = GameHelper.getTauntMessage();
					GameFacebook.sendRequest(gameId, language, targetFbId, message, function(response){
						GameStorage.setLastNudgeViaFacebook(gameId, data.serverLastSubmissionId);
					});	
				}
				processState();
			}
			else {
				GameHelper.alert(data.error);
			}
			$('#btnSubmit').removeAttr('disabled');
		};
		$('#btnSubmit').attr('disabled','disabled');
		createBoardTransact(serverOwnershipArray, gameId, word, playerId, lastKnownTransactionId, "", createBoardTransactCallback);
		GameIdle.clearTimer();
	}
	
	$( "#btnReset" )
      .button()
      .click(function( event ) {
		$(".wordtile").trigger("click");
        event.preventDefault();
		//$("#divWordArea").empty();
     });
	 
	 $( "#btnSubmit" )
      .button()
      .click(function( event ) {
		var word = getSubmissionWord();
		var dictWord = checkWordAllowed(word);
		if (dictWord != null){
			submitWord(dictWord);
		}
        event.preventDefault();
     });
	 
   
	 ////// State machine
	 
	 function handleUpdatesFromServer(){	
	 	if (mQueryLastTransactionState == QueryLastTransactionStateEnum.IN_PROGRESS)
			return;
		mQueryLastTransactionState = QueryLastTransactionStateEnum.IN_PROGRESS;
		setTimeout(function(){mQueryLastTransactionState = QueryLastTransactionStateEnum.EXPIRED;}, GameIdle.MIN_FOCUS_EXECUTE_INTERVAL);
	    var lastKnownId = GameStorage.getLastKnownTransactionId(gameId);
		var queryLastBoardTransactionCallback = function(data){
			if (data.success){
				var lastServerId = data["transactId"];
				consoleLog("Last transaction id from server: " + lastServerId);
				var needsUpdating =  (lastServerId != lastKnownId);
				if (needsUpdating){
					var queryBoardTransactionCallback = function(data){
						if (data.success){
							consoleLog(data);
							GameStorage.storeBoardTransact(gameId, data);
							var serverOwnershipArray = data["ownershipArray"];
							var localOwnershipArray = GameHelper.translateToClientOwnershipArray(gameId, serverOwnershipArray);
							var oldLocalOwnershipArray = GameStorage.ownershipArray;
							GameStorage.ownershipArray = localOwnershipArray;
							$(".boardtile").trigger("colorBaseOnOwnership",[GameStorage.ownershipArray]);
							$(".boardtile").trigger("highlightBaseOnOwnershipChange",[oldLocalOwnershipArray, GameStorage.ownershipArray]);
							GameHelper.updateScores(gameId, language);
							setStateBasedOnTurn();
							GameIdle.indicateGameActive();
							attachTooltipForAllSubmissions(data);
						}
						else{
							consoleLog("Failed queryBoardTransactionCallback");
						}
						mQueryLastTransactionState = QueryLastTransactionStateEnum.None;
					};
					GameHelper.queryBoardTransaction(gameId, queryBoardTransactionCallback);
				}
				else {
					mQueryLastTransactionState = QueryLastTransactionStateEnum.NONE;
				}
			}
			else {
				consoleLog("Failed queryLastBoardTransactionCallback");
			}
		};
		queryLastBoardTransaction(gameId, lastKnownId, queryLastBoardTransactionCallback);		
	 }
	 
	 function processState(){
		if (mGameState == GameStateEnum.NOT_READY)
			return;
		setStateBasedOnTurn();
		switch(mGameState){
			case GameStateEnum.PLAYER_TURN:
				consoleLog("PLAYER_TURN");
				$('#statusFooter').hide();
			// intentional fall through
			case GameStateEnum.OPPONENT_TURN:
				if (mGameState == GameStateEnum.OPPONENT_TURN){
					consoleLog("OPPONENT_TURN");
				}
				handleUpdatesFromServer();
			break;
		}
	 }
	 
})();