// Copyright 2013 - Vincent Chu

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

// word tile: tile being selected by user
// game tile: tile on the board

(function(){
	$("#gamegrid").data("gridWidth", 5);
	$("#gamegrid").data("gridHeight", 5);
	
	var GRIDWIDTH = $("#gamegrid").data("gridWidth");
	var GRIDHEIGHT = $("#gamegrid").data("gridHeight");
	
	
	function calculateBaseFontSize()
	{
		// Set the appropriate font sizes based on screen size
		// .wordtiletext{
		// 	font-size:50px;
		// }
		// 
		// .gametiletext{
		// 	font-size:100px;		
		// }
		
		var viewportWidth = $(window).width();
		var viewportHeight = $(window).height();
		var targetHeight = viewportHeight / (GRIDHEIGHT + 7);
		var targetWidth = viewportWidth / GRIDWIDTH;
		return Math.min(targetWidth, targetHeight);
	}
	
	function appendCalculatedStyles(gameTileFontSize, wordTileFontSize)
	{
		$("<style>").text(
			".wordtiletext { font-size:"+wordTileFontSize+"px }" + 
			".gametiletext { font-size:"+gameTileFontSize+"px }" + 
			"#divWordArea  { height   :"+(wordTileFontSize+10)+"px; padding: "+wordTileFontSize/5+"px }"
		).appendTo("head");
	}
	
	$(document).ready(function () {
  		//$(".gametile").fillText({border: false, spanColor:"green", textAlign:"center", verticalAlign:"middle"});
		//$('#gamegrid').hide();
		var gameId = $.url().param('gameId');
		if (!GameFacebook.isRequestProbablyFromFacebook() || gameId)
		{
			initializeUI();
			$('#gamegrid').show();
		}
	});
	
	function initializeUI()
	{
	  var baseFontSize = calculateBaseFontSize();
	  var baseFontSizeStr = baseFontSize + "px";
	  var wordTileFontSize = baseFontSize / 2;
	  var wordTileFontSizeStr = wordTileFontSize + "px";
	  appendCalculatedStyles(baseFontSize, wordTileFontSize);
	  
	  function returnTileToGrid(tileToRemove){
		  var wordTileId = tileToRemove.attr('id');
		  var tile = tileToRemove.clone();
		  tileToRemove.css({opacity: 0});
		  //tile.css({position: "absolute"});
		  //tile.offset({top: tileToRemove.offset().top, left: tileToRemove.offset().left});
		  var originalId = wordTileId.replace('up','');
		  var orig = $("#"+originalId);
		  orig.css('visibility','visible');
		  orig.css({opacity: 0});
		  var origPosition = orig.offset();
		  var startPosition = tileToRemove.offset();
		  $("body").append(tile);
		  tile.css({ position:"absolute" });
		  tile.offset({ top: startPosition.top, left: startPosition.left });
		  tile.removeClass("span1");
		  tile.removeClass("wordtile").removeClass("wordtiletext");
		  tile.height( $("#divWordArea").height() );
		  //tile.width( orig.width() );
		  //
		  tile.animate({
			  top: origPosition.top
			  , left: origPosition.left
			  , width: orig.width()
			  , height: orig.height()
			  , fontSize: baseFontSizeStr
				  }
			  , 200
			  , function(){
				  // animate complete
				  tileToRemove.remove();
				  tile.remove();
				  orig.css({opacity: 1});
				  $("#divWordArea").trigger("adjustScore");
		  });	
	  }
	  
	function transformItemIntoWordTile(item, originalId) {
		item.attr('id', originalId+'up');
		item.removeClass("gametile").removeClass("gametiletext");
		item.addClass("wordtile").addClass("wordtiletext").addClass("span1");
		//item.bind("returnTileToGrid", returnTileToGrid);
		item.css('width', '');
		/*item.draggable({
			axis: "y"
			, distance: 10
			
		});*/
		return item;
	}
	
	  $("#divWordArea").sortable({
		  placeholder:'span1'
		  , tolerance: "pointer"
		  , beforeStop: function( event, ui ) {
			var distanceDragged = (ui.position.top - ui.originalPosition.top);
			var shouldRemove = distanceDragged > baseFontSize;
			if (shouldRemove){
				tileToRemove = ui.item;
				tileToRemove.offset({ top: ui.position.top, left:ui.position.left });
				returnTileToGrid(tileToRemove);
			}
		  }
  		  //, cursorAt: { bottom: 5, left: 5 }
	  });
  
	  $("#divWordArea").disableSelection();
	  $("#divWordArea").droppable({
		  activeClass: "ui-state-default",
		  hoverClass: "ui-state-hover",
		  accept: '.gametile',
		  tolerance: "pointer",
		  drop: function(event, ui) {
  
			  var item = $(ui.draggable);
			  
			  /*if (item.hasClass('wordtile'))
			  {
				  return;
			  }*/
			  
			  if(item.hasClass('gametile'))
			  {
				  var originalId = ui.helper.attr('id').replace('drag','');
				  transformItemIntoWordTile(item, originalId);
				  $("#divWordArea").trigger("adjustScore");
				  $("#"+originalId).css('visibility','hidden');
			  }
		  }
	  });
	  
	  $(".gametile").draggable({
		  //refreshPositions: true,
		  connectToSortable: '#divWordArea',
		  distance: 10,
		  revert: 'invalid',
		  /*revert: function(socketObj)
		  {
			 //if false then no socket object drop occurred.
			 if(socketObj === false)
			 {
				//revert the peg by returning true
				return true;
			 }
			 else
			 {
				//socket object was returned,
				//we can perform additional checks here if we like
				//alert(socketObj.attr('id')); would work fine
				//socketObj.toggle();
				//return false so that the peg does not revert
				return false;
			 }
		  },*/
		  opacity: 0.75,
		  cursorAt: { top: 5, left: 5 },
		  helper: function (event) {
			var toReturn = $('<div class="boardtile wordtile wordtiletext">'+$(this).clone().children().remove().end().text()+'</div>');
			toReturn.height($("#divWordArea").height());
			toReturn.width(wordTileFontSizeStr);
			toReturn.css("background-image",$(this).css("background-image"));
			toReturn.css("background-color",$(this).css("background-color"));
			toReturn.css("color",$(this).css("color"));
			toReturn.attr('id', $(this).attr('id')+'drag');
			//$(this).toggle();
			return toReturn;
			//var ret = $(this).clone();
			//ret.attr('dragId', id);
			//console.log('dragId: ', ret.attr('dragId'));
			//return ret();
		  }
	  })
	  
	  $(".gametile").click(function() {
		  // make a new item with the same property of the game tile, except now with wordtile class
		  var item = $(this).clone();
		  item.removeClass("gametile").removeClass("gametiletext");
		  //alert(item.text());		
		  item.addClass("span1").addClass("wordtiletext");		
		  item.css({ position:"absolute", fontSize:baseFontSizeStr });
		  $("#divWordArea").append(item);
		  // set item to have a id similar to the original with "up" appended
		  var originalId = $(this).attr('id');
		  item.attr('id', originalId+'up');
		  item.offset({top: $(this).offset().top, left: $(this).offset().left});
		  item.height( $(this).height() );
		  item.width( $(this).width() );
		  // create a placeholder and put it to the desired location
		  var placeholder = $('<div class="wordtile wordtiletext span1"></div>');
		  placeholder.css({opacity: 0});
		  $("#divWordArea").append(placeholder);
		  var placeholderPos = placeholder.offset();
		  //alert(placeholder.height());
		  $("#"+originalId).css('visibility','hidden');
		  
		  item.animate({
			  top: placeholderPos.top
			  , left: placeholderPos.left
			  , width: placeholder.width()
			  , height: placeholder.height()
			  , fontSize: wordTileFontSizeStr
				  }
			  , 200
			  , function(){
				  // animate complete
				  placeholder.remove();
				  item.detach();
				  transformItemIntoWordTile(item, originalId);
				  //item.addClass("wordtile");
				  item.css({ "position":"static" });
				  $("#divWordArea").append(item);
				  $("#divWordArea").trigger("adjustScore");
				  //item.bind("returnTileToGrid", returnTileToGrid);
		  });
	  });
	  
	  $("#divWordArea").on("click", ".wordtile", function() {
		  returnTileToGrid($(this));
		  //$(this).trigger("returnTileToGrid");
	  });
	  
	  function colorTileBaseOnOwnership(tile, ownership, isDefended)
	  {
		  if (ownership != "b") //not a blank tile with no ownership
		  {
			if (ownership == "p")
				tile.removeClass("opponent").addClass("player");
			else
				tile.removeClass("player").addClass("opponent");
			
			if (isDefended)
				tile.addClass("defended");
			else
				tile.removeClass("defended");
		  }
		  else
		  {
			  tile.removeClass("opponent").removeClass("player").removeClass("defended");
		  }
	  }
	  
	  function getTileOwnership(x, y, ownershipArray){
		  var index = y * GRIDWIDTH + x;
		  if (x < 0 || x >= GRIDWIDTH || y < 0 || y >= GRIDHEIGHT)
		  	return null;
		  else
			return ownershipArray[index]; // b= blank, p == player, o == opponent
	  }
	  
	  $("#gamegrid").on("highlightBaseOnOwnershipChange", ".boardtile", function(event, oldOwnership, newOwnership) {
		  var item = $(event.target);
		  var itemId = item.attr("id");
		  var itemX = parseInt(itemId[1]);
		  var itemY = parseInt(itemId[2]);
		  var oldOwnership = getTileOwnership(itemX, itemY, oldOwnership);
		  var newOwnership = getTileOwnership(itemX, itemY, newOwnership);
		  if (oldOwnership != newOwnership)
		  {
			  GameHelper.highlight(item, 5); // highlight for 5 seconds
		  }
	  });
	  
	  $("#gamegrid").on("colorBaseOnOwnership", ".boardtile", function(event, ownershipArray) {
		  var item = $(event.target);
		  var itemId = item.attr("id");
		  var itemX = parseInt(itemId[1]);
		  var itemY = parseInt(itemId[2]);
		  var itemOwnership = getTileOwnership(itemX, itemY, ownershipArray);
		  var upOwnership = getTileOwnership(itemX, itemY-1, ownershipArray);
		  var leftOwnership = getTileOwnership(itemX-1, itemY, ownershipArray);
		  var rightOwnership = getTileOwnership(itemX+1, itemY, ownershipArray);
		  var downOwnership = getTileOwnership(itemX, itemY+1, ownershipArray);
		  var defended = 		((upOwnership == itemOwnership) ||  (upOwnership == null) ) 
		  					&&  ((downOwnership == itemOwnership) ||  (downOwnership == null) ) 
							&&  ((leftOwnership == itemOwnership) ||  (leftOwnership == null) ) 
							&&  ((rightOwnership == itemOwnership) ||  (rightOwnership == null) ) 
		  colorTileBaseOnOwnership(item, itemOwnership, defended);
		  
		  // make sure the selected tiles are also colored
		  colorTileBaseOnOwnership($('#'+itemId+'up'), itemOwnership, defended);
	  });
	  
	  $("#gamegrid").on("upateTileCharacter", ".boardtile", function(event, orderedTiles) {
		  var item = $(event.target);
		  var itemId = item.attr("id");
		  var itemX = parseInt(itemId[1]);
		  var itemY = parseInt(itemId[2]); 
		  var index = itemY * GRIDWIDTH + itemX;
		  var value = orderedTiles[index];
		  var language = $.url().param('language');
		  var score = GameScore.getTileScore(value, language);
		  //item.text(value);
		  if (score > 0)
			  item.html(value + '<sup class="scorescript" id="'+itemId+'_score">'+score+'</sup>');
		  else
		  	  item.text(value);
		  item.data('score', score);
	  });
	  
	window.addEventListener("orientationchange", function() {
	  //Refresh page and let everything readjust
	  location.reload();
	}, false);
	  
	  
	} // end initializeUI

})();