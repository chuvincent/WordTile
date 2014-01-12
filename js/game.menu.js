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
	var gameId = $.url().param('gameId');
	
	var TOOLTIP_STRINGS = {
		 '#gamegrid': {text:'1. Choose tiles from the game grid to form a word by clicking on tiles on dragging them.  Tiles do not have to be connected in any way.', pos:'auto'}
		, '#btnSubmit': {text:"2. Click here to submit your word.  If it's a valid entry, the tiles you used would change into green - unless the tile is in dark brown.", pos:'auto'}
		, '#playerScore': {text:"3. The number of tiles in your color (green) is shown here.  When every tile on the game grid has a color, you want your score to be higher than your opponent's.  Player with the higher score wins (duh!).", pos:'auto'}
		, '#opponentScore': {text:'4. Your opponent would try to do the same thing.  You want your tiles to be together so they would become dark brown to your opponent and more difficult to steal.', pos:'auto'}
		, '#gamenavbar': {text:"That's it!  Pretty straight forward.  You can find other useful information such as how many words are left and what the past submissions were here.", pos:'auto'}
	};
	
	function getVSString(){
		return $('#playerName').data('val') + " vs. " +$('#opponentName').data('val');
	}
	
	function enableMenuItems(){
		if (gameId){
			$('#menuStats').parent().removeClass('disable');
			$('#menuStats').parent().addClass('active');
			$('#menuLink').parent().removeClass('disable');
			$('#menuLink').parent().addClass('active');
		}
		else{
			$('#menuStats').parent().addClass('disable');
			$('#menuStats').parent().removeClass('active');
			$('#menuLink').parent().removeClass('disable');
			$('#menuLink').parent().addClass('active');
		}
	}
	
	$(document).ready(function () {
		enableMenuItems();
	});
	
	function identifyWordCategory(word){
		var CATEGORIES = GameHelper.getWordsCategories();
		var boardInfo = GameStorage.getBoardInfo(gameId);
		for (var catk in CATEGORIES){
			var cat = CATEGORIES[catk];
			var allowedWords = boardInfo[cat];
			if (!allowedWords) continue;
			if (allowedWords[word])
			{
				return cat;
			}
		}
		return "Unknown";
	}
	
	function calculateCurrentCategoryStats(){
		var data = GameStorage.getBoardTransact(gameId);
		var allSubmissions = data["allSubmissions"];
		var result = {};
		if (allSubmissions){
			var boardInfo = GameStorage.getBoardInfo(gameId);
			var CATEGORIES = GameHelper.getWordsCategories();	
			for (var catk in CATEGORIES){
			  var cat = CATEGORIES[catk];
			  var allowedWords = boardInfo[cat];
			  if (!allowedWords) continue;
			  var count = 0;
			  for (var key in allowedWords) { 
			  	count+=1; 
			  }
			  result[cat] = count;
			}
			for (var submissionk in allSubmissions){
				var submission = allSubmissions[submissionk];
				var cat = identifyWordCategory(submission);
				result[cat] = Math.max(0, result[cat]-1);
			}
		}
		return result;		
	}
	
	function calculateCurrentLengthStats(){
		var data = GameStorage.getBoardTransact(gameId);
		var allSubmissions = data["allSubmissions"];
		var result = {};
		if (allSubmissions){
			var boardInfo = GameStorage.getBoardInfo(gameId);
			var CATEGORIES = GameHelper.getWordsCategories();	
			for (var catk in CATEGORIES){
			  var cat = CATEGORIES[catk];
			  var allowedWords = boardInfo[cat];
			  if (!allowedWords) continue;
			  for (var key in allowedWords) {
				if ( !result[ key.length ] )
				{
					result[ key.length ] = 0;
				}
				result[ key.length ] = result[ key.length ] + 1; 
			  };
			}
			for (var submissionk in allSubmissions){
				var submission = allSubmissions[submissionk];
				result[submission.length] = Math.max(0, result[submission.length]-1);
			}
		}
		return result;		
	}
	
	function generateStatsTableBody(){
		var table = $('#statsModalTableBody');
		table.empty();
		//var DEBUG = {'a':1,'b':2};
		var stats = calculateCurrentCategoryStats();
		for (var cat in stats){			
			var tr = $('<tr>');
			var prettycat = cat.replace('_reb','');
			prettycat = prettycat.charAt(0).toUpperCase() + prettycat.slice(1);
			tr.append($('<td>'+prettycat+'</td>'));
			tr.append($('<td>'+stats[cat]+'</td>'));
			table.append(tr);
		}
	}
	
	function generateLengthStatsTableBody(){
		var table = $('#lengthStatsModalTableBody');
		table.empty();
		//var DEBUG = {'a':1,'b':2};
		var stats = calculateCurrentLengthStats();
		for (var i = 25; i>=1; i--){
			if (stats[i])
			{			
			  var tr = $('<tr>');
			  tr.append($('<td>'+i+'</td>'));
			  tr.append($('<td>'+stats[i]+'</td>'));
			  table.append(tr);
			}
		}
	}
	
	function generateAllSubmissionsTableBody(){
		var table = $('#allSubmissionsTableBody');
		table.empty();
		//var DEBUG = {'a':1,'b':2};
		var transact = GameStorage.getBoardTransact(gameId);
		var pastSubmissions = transact["allSubmissions"];
		var submissionBy = transact['submissionBy'];
		var lastPlayer = (submissionBy == GameStorage.getPlayerId(gameId)) ? "You" : "Opponent";
		var otherPlayer = (submissionBy != GameStorage.getPlayerId(gameId)) ? "You" : "Opponent";
		var lengthParity = (pastSubmissions.length + 1) % 2; // should be -1, but in case of length == 0, better do +1 instead
		for (var subk in pastSubmissions){			
			var tr = $('<tr>');
			tr.append($('<td>'+pastSubmissions[subk]+'</td>'));
			var byWho = lastPlayer;
			if (lengthParity != (subk % 2))
			{
				byWho = otherPlayer;
			}
			tr.append($('<td>'+byWho+'</td>'));
			table.append(tr);
		}
	}
	
	function generateDebugnfo(){
		var debugVars = ["GameStorage.getPlayerId(gameId)"
			, 'GameStorage.ownershipArray'
			, 'GameStorage.getBoardTransact(gameId)'
			, 'GameHelper.translateToClientOwnershipArray(gameId, GameStorage.getBoardTransact(gameId)["ownershipArray"]);'
		
		];
		var table = $('#debugModalTableBody');
		table.empty();
		for (var debugK in debugVars){			
			var tr = $('<tr>');
			tr.append($('<td>'+debugVars[debugK].substring(0, 5)+'</td>'));
			var outputObject = eval(debugVars[debugK]);
			var output = '';
			if ($.isPlainObject(outputObject)){
			  for (property in outputObject) {
				output += property + ': ' + outputObject[property]+'; ';
			  }
			}
			else
			{
				output = outputObject;
			}
			tr.append($('<td>'+ output +'</td>'));
			table.append(tr);
		} 
	}
	
	$('#menuStats').click(function(){
		$('#statsModal').modal();
		$('#statsModalLabel').text("Game: " + getVSString());
		generateStatsTableBody();
		generateAllSubmissionsTableBody();
		generateLengthStatsTableBody();
	});
	
	$('#menuLink').click(function(){
		$('#linkModal').modal();
		$('#linkModalLabel').text("Game: " + getVSString());
		$('#inputGameURLLink').val(window.location.href);
		GameHelper.selectOnFocus('#inputGameURLLink');
	});
	
	function invertColor(hexTripletColor) {
	  var color = hexTripletColor;
	  color = color.substring(1);           // remove #
	  color = parseInt(color, 16);          // convert to integer
	  color = 0xFFFFFF ^ color;             // invert three bytes
	  color = color.toString(16);           // convert to hex
	  color = ("000000" + color).slice(-6); // pad with leading zeros
	  color = "#" + color;                  // prepend #
	  return color;
	}
	
	function changeTooltipColorTo(color) {
        $('.tooltip-inner').css('background-color', color)
		$('.tooltip-inner').css('color', invertColor(color))
        $('.tooltip.top .tooltip-arrow').css('border-top-color', color);
        $('.tooltip.right .tooltip-arrow').css('border-right-color', color);
        $('.tooltip.left .tooltip-arrow').css('border-left-color', color);
        $('.tooltip.bottom .tooltip-arrow').css('border-bottom-color', color);
    }
	
	var instructionInProgress = false;
	function hideAllInstructions(){
		for (var elem in TOOLTIP_STRINGS){
			$(elem).tooltip('destroy');
		}
		instructionInProgress = false;
	}
	
	$('#menuInstructions').click(function(){
		if (!instructionInProgress){
			instructionInProgress = true;
			$('.nav-collapse').collapse('hide');
			var delay = 1000;
			var DELAY_INTERVAL = 9000;
			for (var elem in TOOLTIP_STRINGS){
				var pos = GameHelper.toolTipAutoPlacement;
				if (TOOLTIP_STRINGS[elem].pos != 'auto')
				{
					pos = TOOLTIP_STRINGS[elem].pos;
				}
				$(elem).tooltip({title: TOOLTIP_STRINGS[elem].text
								, placement: pos							
				});
				var delayFcn = function(target){
					// setTimeout with closure is so much fun!
					return function(){
					  target.tooltip('show');
					  //changeTooltipColorTo('#FFD119');
					  setTimeout(function(){target.tooltip('hide');}, DELAY_INTERVAL);
					}
				}
				setTimeout(delayFcn($(elem)), delay);	
				delay += DELAY_INTERVAL;		
			}
			setTimeout(hideAllInstructions, delay);
		}
	});
	
	$('#menuDebug').click(function(){
		$('#debugModal').modal();
		generateDebugnfo();	
	});
	
	$('.nav-collapse').on('show', function () {
		$('#playerName').popover('hide');
		$('#opponentName').popover('hide');
	});
	 
})();