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

var GameHelper = {
  consoleLog: function(data)
  {
	  //var input = "submit";
	  //if (data && data.substring && data.substring(0, input.length) === input)
	  if (GameHelper.DEUBG)
	  {
	  	console.log(data);
		$('#debugModalExtraText').html($('#debugModalExtraText').html()+"<br>"+data);
	  }
  },
  
  assert: function(boolStatement, msg)
  {
	  if (!boolStatement)
	  	console.log("ASSERT: "+msg);
  },
  
  // UI
  toolTipAutoPlacement: function(tip, element) {
		var $element, above, actualHeight, actualWidth, below, boundBottom, boundLeft, boundRight, boundTop, elementAbove, elementBelow, elementLeft, elementRight, isWithinBounds, left, pos, right;
		isWithinBounds = function(elementPosition) {
		  return boundTop < elementPosition.top && boundLeft < elementPosition.left && boundRight > (elementPosition.left + actualWidth) && boundBottom > (elementPosition.top + actualHeight);
		};
		$element = $(element);
		pos = $.extend({}, $element.offset(), {
		  width: element.offsetWidth,
		  height: element.offsetHeight
		});
		actualWidth = 240;
		actualHeight = 117;
		boundTop = $(document).scrollTop();
		boundLeft = $(document).scrollLeft();
		boundRight = boundLeft + $(window).width();
		boundBottom = boundTop + $(window).height();
		elementAbove = {
		  top: pos.top - actualHeight,
		  left: pos.left + pos.width / 2 - actualWidth / 2
		};
		elementBelow = {
		  top: pos.top + pos.height,
		  left: pos.left + pos.width / 2 - actualWidth / 2
		};
		elementLeft = {
		  top: pos.top + pos.height / 2 - actualHeight / 2,
		  left: pos.left - actualWidth
		};
		elementRight = {
		  top: pos.top + pos.height / 2 - actualHeight / 2,
		  left: pos.left + pos.width
		};
		above = isWithinBounds(elementAbove);
		below = isWithinBounds(elementBelow);
		left = isWithinBounds(elementLeft);
		right = isWithinBounds(elementRight);
		if (above) {
		  return "top";
		} else {
		  if (below) {
			return "bottom";
		  } else {
			if (left) {
			  return "left";
			} else {
			  if (right) {
				return "right";
			  } else {
				return "right";
			  }
			}
		  }
		}
  },
  
  selectOnFocus: function(element)
  {
	  if ($.browser.webkit){
		  $(element).attr('readonly', false);
	  }
	  $(element).mouseup(function(e){
		e.preventDefault();
	  });
	  $(element).focus(function() { $(this).select(); });	
	  //$(element).focus(function() { $(this).select(0,9999) });
	  //$(element).click(function() { $(this).select(0,9999) });
  },
  
  // Board
  
  getWordsCategories: function()
  {
	  var JAP_CATEGORIES = ["JLPT1_reb", "JLPT2_reb", "JLPT3_reb", "JLPT4_reb", "uncommon_reb", "common_reb"];
	  return JAP_CATEGORIES;
  },
  
  // Update score based on ownershipArray
  updateScores: function(gameId, language)
  {
	  var ownershipArray = GameStorage.ownershipArray;
	  var playerScore = 0;
	  var opponentScore = 0;
	  var blank = 0;
	  var storedBoardInfo = GameStorage.getBoardInfo(gameId);
	  var orderedTiles = storedBoardInfo.orderedTiles;
	  $.each(ownershipArray, function(i, element) {
		  var tileScore = GameScore.getTileScore(orderedTiles[i], language);
		  if (tileScore == 0){
			tileScore = 1;  
		  }
		  if (element == "p")
			  playerScore+= tileScore;
		  else if (element == "o")
			  opponentScore+= tileScore;
		  else
		  	  blank++;
	  });
	  $("#playerScore").text(playerScore);
	  $("#opponentScore").text(opponentScore);
	  $( "#gamegrid" ).data("playerCurrentScore", playerScore);
	  $( "#gamegrid" ).data("opponentCurrentScore", opponentScore);
	  //GameHelper.consoleLog('updateScores: opponentScore:'+opponentScore+', playerScore: '+playerScore+', blank:'+blank);
	  if (opponentScore >= playerScore && blank == 0){
		  //GameHelper.consoleLog('Game Finish Trigger o');
		  $("#gamegrid").trigger("gameFinished",['o']);
	  }
	  else if (playerScore >= opponentScore && blank == 0){
		  //GameHelper.consoleLog('Game Finish Trigger p');
		  $("#gamegrid").trigger("gameFinished",['p']);
	  }
  },
  
  getTauntMessage: function(){
	  var playerScore = $( "#gamegrid" ).data("playerCurrentScore");
	  var opponentScore = $( "#gamegrid" ).data("opponentCurrentScore");
	  if (playerScore > opponentScore){
		 return "I'm beating you " + playerScore + " to " + opponentScore;
	  }
	  else{
		 return "You're slightly ahead of me, but that's about to change.";
	  }
  },
  
  queryBoardTransaction: function(gameId, callback)
  {
	  if (!GameHelper.DEBUG){
		$.post("ws/queryBoardTransact.php", { "gameId": gameId },
		  function(data){
			  //GameHelper.consoleLog(data);
			  callback(data);
		  }, "json").fail(function(){ GameHelper.consoleLog("Fail queryBoardTransaction");callback({}); });
	  }
	  else
	  {
		  //DEBUG
		  var data = {success: 1};
		  callback(data);
	  }
	},
	
	translateToServerOwnershipArray: function(gameId, localOwnershipArray){
		//GameHelper.consoleLog(localOwnershipArray);
		var serverOwnershipArray = [];
		var playerId = GameStorage.getPlayerId(gameId);
		var opponentId = GameHelper.getOpponentId(playerId);
		for (var k in localOwnershipArray){
			var localOwnership = localOwnershipArray[k];
			var serverOwnership = 0;
			if (localOwnership == 'p')
				serverOwnership = playerId;
			else if (localOwnership == 'o')
				serverOwnership = opponentId;
			serverOwnershipArray.push(serverOwnership);
		}
		return serverOwnershipArray.join('');
	},
	
	translateToClientOwnershipArray: function(gameId, serverOwnershipArray){
		var localOwnershipArray = [];
		var playerId = GameStorage.getPlayerId(gameId);
		var opponentId = GameHelper.getOpponentId(playerId);
		for (var k in serverOwnershipArray){
			var serverOwnership = serverOwnershipArray[k];
			//GameHelper.consoleLog(serverOwnership);
			var localOwnership = 'b';
			if (serverOwnership == playerId)
				localOwnership = 'p'
			else if (serverOwnership == opponentId)
				localOwnership = 'o'
			localOwnershipArray.push(localOwnership);
		}
		return localOwnershipArray;	
	},
	
	highlight: function(item, timeOut){ // timeOut in seconds
		item.addClass('glowable');
		var glowableId = setInterval(function(){
			item.toggleClass('glow');
		}, 1000);
		setTimeout(function(){
			clearInterval(glowableId);
			item.removeClass('glowable');
		}, timeOut * 1000);
	},
	
	indicateTurn: function(isPlayerTurn){
		var glowable = $("#playerName");
		glowable.removeClass('glowable');
		glowable.removeClass('glow');
		var pastGlowableId = glowable.data('glowableId');
		if (pastGlowableId){
			clearInterval(pastGlowableId);
			glowable.removeData('glowableId');
		}
		if (isPlayerTurn){
			$("#playerturn").css('visibility','visible');
			$("#opponentturn").css('visibility','hidden');
			glowable.addClass('glowable');
			var glowableId = setInterval(function(){
				glowable.toggleClass('glow');
			}, 1000);
			glowable.data('glowableId', glowableId);
		}
		else {
			$("#playerturn").css('visibility','hidden');
			$("#opponentturn").css('visibility','visible');
		}
	},
	
	// find out who's turn it should be
	isPlayerTurn: function(gameId, lastSubmission){
		if (!lastSubmission)
		{
			// if there's no last submission, then last submission is treated as 
			// if done by the opponent of the person who created the game
			lastSubmission = 1; 
		}
		var isLastDoneByPlayer = (lastSubmission == GameStorage.getPlayerId(gameId));
		GameHelper.consoleLog("isLastDoneByPlayer: "+isLastDoneByPlayer);
		var isPlayerTurn = !isLastDoneByPlayer;
		return isPlayerTurn;
	},
	
	getOpponentId: function(playerId){
		if (playerId == 1)
			return 2;
		return 1;
	}, 
	
	getGuid: function(){
		return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
		/*return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});*/
	},
	
	alert: function(msg){	
		GameHelper.consoleLog(msg);
        $("<div class=\"alert alert-error\">\
			<button type=\"button\" class=\"close\" data-dismiss=\"alert\">&times;</button> \
			<span class=\"label label-important\">Error</span><p> " + msg + "</p></div>").dialog();
		$(".ui-dialog-titlebar").hide();
	},
	
	enumToString: function(theEnum,value) {
		for (var k in theEnum) if (theEnum[k] == value) return k;
		return null;
	},
  
  DEBUG : 1,
  DEBUG_DB: {}
  /*DEBUG_DB :{"uncommon_reb":["ネック","インスラ","けんねつ","たつい","ひんする","ひるい","けいらん","ヒット","けいぎん","ひるぎ","くすい","すん","インスト","ひらける","オンス","けいたいひん","ごおん","ひるね","らいぎょ","ぎくん","たっけい","ひくい","イライト","ケルト","ごんす","おける","いた","すいつける","ネット","ぎょらい","らっけい","ぎんい","るすい","たぎる","らいけん","ぎんた","クライト","ひいく","ひとぎらい","つけおとす","いおん","らんぎく","すいひん","タン","たんねん","インスタント","ねぎる","ったく","たっけん","らいひん","ヒッタイトご","いたいけ","つっと","るい","ケンネル","たぎご","トル","トラ","ひつけ","タス","いいすぎ","とらぎす","くすん","けいらく","ぎする","オクタン","クイント","ケイン","タイ","ケトン","トス","トラス","たくらん","とする","ねつけす","トライ","らくたん","ケトル","くるひ","ラルゴ","ねったいぎょ","けんと","いくい","くるっ","ついたいけん","つけね","いとおす","すいけん","タンク","けんい","ぎょたい","けんお","くすね","いくつ","いんけん","けっする","ひねくる","けんご","いくひ","けんす","けんたい","ぎょっと","ねい","する","ごくん","いらつく","トランク","おくねん","ぎいんとっけん","ケルン","ねた","ねす","トランス","おっけん","たけい","いっとく","おくする","けんおん","ギンッ","けんらん","ネットイン","けいいん","ぎごく","いする","くぎん","たけす","ついけい","るいいん","すく","すぎ","ごたつく","ランクル","すい","ねる","つね","ねん","すけ","たんすい","タンゴ","ごくい","おんたく","すね","タックイン","おんたい","らくたい","すいぎょ","たける","くらいする","イラスト","ぎょくと","ひょいと","ネックライン","おんねつ","オイルご","ぎょけい","けいつい","ルックス","ネイル","くっすん","けいねん","クオンツ","くっする","ねっけつ","いくん","つけぎ","タラ","いんけい","ひする","くける","けんたん","ねんご","ネクタイ","ごくひ","すいけい","ねっけい","けっすい","トラヒック","いいおく","らくいん","タイト","ねいる","おいらん","くいすぎ","らくひつ","タイツ","らいたく","たけ","おっす","たく","オラクル","いいとおす","いとすぎ","たいごく","たい","とけつ","けいたく","とんけん","おくす","いっすん","けいたい","けつらく","くっす","たね","くけい","おくい","ぎけい","たけん","ひっつく","たつ","ランク","タクト","たいるい","ラおん","ひん","ひんい","たいぎょ","らたい","タイラギ","ライオン","ひらたけ","スタイ","ひら","ひる","たっす","とくい","ごすい","ラスク","いんらん","ひけい","ネクスト","とくひつ","すいぎん","ねぎらい","いっつい","ごくねつ","つい","タクる","たくぎん","ひご","クラスタ","トタン","ひくつ","ひた","たおる","ひい","ひらたん","いくら","おったつ","たらい","ひぎ","ひく","タイご","とっく","ねんらい","すいおん","らんけい","ねつぎ","ねつく","インス","ぎひつ","すけっと","ひつ","ひっ","ねつけ","ひと","トッケイ","ぎたいご","らいねん","タントラ","たん","たいとく","すごく","ひっすい","ねいす","たる","たら","ひねる","ひんけい","いるす","おいらく","ぎけん","くけん","いるい","イオタ","おくいん","クラスト","おごと","くいけ","おくら","ひんけつ","いっすい","けっす","おんいん","ぎょする","くぎ","おんる","らい","ヒル","けん","けいひつ","おっつけ","オタク","おっつく","いいくらす","すとん","いる","いんたい","いら","ツイン","ひたん","いんたく","とつけい","ツイル","けら","ひたる","すいたい","いん","といった","ひとくい","つくる","ひけね","けんする","らんくつ","たんけん","けいトラ","いいおとす","けたおす","ゴツン","ごすんくぎ","すいいけい","いぎ","いく","ライト","つくね","タルト","いい","ツイスト","くたい","おすい","いんぎん","つんと","いす","いご","いけ","いとく","ライスケイク","オケる","いと","ギルト","いつ","くんおん","ぎんけい","ひたと","いおとす","るいけい","すらっと","すぎごけ","クルス","らん","おんと","とっくん","ヒス","けいひん","けおとす","けつ","いつらく","ひとつ","おんねん","ルイン","タスク","たらんと","ぎょるい","けごん","ねつるい","けす","おんぎ","タルク","ごとく","クランケ","くいいる","おんぎょく","けい","ひとく","るいおん","ストけん","ごけい","たねん","おす","ネクトン","おご","ラオス","おけ","るいぎご","おぎ","おく","ぎょくたい","ひらったい","おい","ごけた","おんすいタンク","イン","インゴット","インラインスタイル","イントランス","おね","おつ","いっけつ","ひっけん","ひごい","いっけん","イオ","ぎねん","つと","けんつく","スタン","イイ","いけす","ラスト","いけい","おつぎ","タオルケット","くねつ","くつおと","つぎ","つく","ごねん","たぎ","ルック","ひごと","ケルトご","つた","トルク","たいする","ごねる","クイッケン","たんらん","つけ","いっく","ラック","いけん","ラン","らくご","ごつい","ひらく","いっけい","タラント","ひねつ","いっす","ぎたい","ひらい","とす","いける","いいん","とお","たんらく","たいん","つる","いっと","つら","すいひ","くらい","ライン","いいひらく","いつく","いんイオン","たいすい","とぎ","ランクイン","ラス","ごった","ぎおんご","おん","るいねん","おら","スタック","ごけん","ひとけた","ライ","ラット","いつけいたい","いいおくる","ひつい","ひっけい","タラゴン","ライク","ねすぎる","いいね","とくたい","けぎらい","いくねん","いひん","ストライク","ぎくっと","らんご","トランクス","とらい","タック","いたっ","すくいとる","たいおんけい","たらす","といた","いんねん","たくひつ","いたご","おんくん","おんいんたいけい","っす","いっする","いたく","たくいつ","すいらん","けねん","いたい","ぎょい","ヒッタイト","スケルトン","とっけつ","けいるい","ぎょく","つぎたす","ねくら","けんとく","ごくひん","クルトン","ぎょす","るいひ","ひったつ","いんぎ","るいく","とたん","おんとく","おけら","とけい","るすたく","ぎょひ","るいご","ラクトン","とんご","たねつけ","いとたけ","オン","ひんく","ストック","ひったん","ヒストン","ぎいん","おっと","いらん","ぎょくおん","いいつけ","ごんすけ","いいつくす","くねる","タイラント","ごいん","イクラ","すいとる","ランタン","クライ","オルタネイト","タイゴン","すくい","オケ","すいとん","たいくん","けいいぎ","すくね","けんいん","ごたく","ラックス","いたん","すいらい","たいねつ","ごたい","ぎおん","おんけん","いとらん","スタイン","たくする","けんすい","クラス","ぎらっ","スルタン","すいつく","たいらん","らんすい","いんとく","ごけ","クラン","すいく","とる","すいい","トック","たくる","つける","ぎょたく","らいいん","ギョッ","いいたす","くつ","ごるい","らくね","すんごい","いったい","オルゴン","けいごく","くすねる","くひ","ごっくん","イランご","くい","おとく","たんご","とくぎ","おとご","くす","たんおん","けいする","いったく","ごくいん","たいイオン","ねとる","イット","トランスけい","タックル","とおい","おいた","つんけん","おいご","おとぎ","ついおく","インライン","いったん","くる","すける","くら","おひるぎ","けつるい","すいぎょく","るいおんご","けいすい","とおね","たいいん","くん","たんすいぎょ","ねつけん","けんるい","タックス","くいすぎる","たいぎ","たいく","いんとん","たいい","ネオン","たいす","ねごと","ひったくる","けいと","オックご","たいけ","たいご","いひつ","たいと","けいトラック","くご","ぎゅっと","すねる","ケトンたい","たくす","ひっつける","すいくん","けいひ","たいひ","とくする","くらっと","いんする","ひっす","けったく","ネス","けったい","けんぎ","とくたいけん","けつご","けたい","とっつく","つけいる","ぎひ","ひけ","スタント","ランス","ひおけ","ぎく","いいすぎる","すぎいく","ぎらつく","スタンツ","けいら","ルクス","ぎす","ひけつ","オルト","すたる","おんすい","ねっすい","けっく","おねつ","くるい","たすく","おんい","らいす","とひ","ついひ","とったつ","ランスル","たいけい","イントラ","おひつ","スケ","オクラ","らいい","とぎらす","とつ","けご","ねつらい","ついす","んとする","とぎょ","ネスト","いんいつ","ごん","とご","ついご","つくねんと","とぎん","ついく","とく","たんぎん","とい","たんと","くいん","すっくと","いんご","ネオ","ネッスル","ごと","たいけん","いんい","とんす","いんいん","たんお","スラック","らくるい","たんく","ごす","ぎいとん","たんい","くいたおす","たとする","ごぎ","ごく","とら","ひいらぎ","ごい","ラタン","とったん","とっけい","ねぎ","ひけん","ストイック","イオン","ネル","つるおと","つけたす","けついん","けったん","ひける","たいぎご","ひるすぎ","けいい","イラク","けいく","ごする","いいひと","ひんいご","けいご","くいる","くんぎ","くんい","インクライン","けいす"],"JLPT4_reb":["すく","たす","いけん","おたく","ひらく","すぎる","おく","とおく","おっと","けん","いたす","つる","いと","すっ","すると","おと","るす","くん","つける","ねつ","たいいん","おる","すごい","いん","とおる","つく","すっと","おとす","おくる"],"JLPT3_reb":["たいら","いいん","とおす","タオル","たく","いた","おく","たいおん","らく","おい","ぎいん","ひく","ひたい","らい","トラック","けん","いね","とん","おとる","くらい","たいくつ","たんい","インク","たね","とら","おいつく","くらす","たつ","くん","たんご","つける","たい","する","いんたい","いらい","おひる","トンネル","とくい","おん","たすける","ねったい","ラケット","たおす","つく","けいい","ぎん","とたん","たっする","スタイル","つらい","つい","たいいく","いたる","とける","とく","いったい","トン","たいする","おくる","とい"],"JLPT2_reb":["いぎ","いく","すぎ","たけ","ごらん","たく","ごと","くぎ","たんすい","いご","ねっする","いいつける","おんけい","つる","ごく","おんたい","いつ","たんす","とる","ひるね","ける","たつ","くっつける","いる","くぎる","らん","けん","たいけい","おん","ごらく","たる","けいと","いったん","けい","つく","オイル","ねらい","けた","つるす","けいご","とける","とく","ひねる"],"JLPT1_reb":["いぎ","ひたす","けつい","ヒント","ぎけつ","いけん","けつぎ","いい","つねる","ひたすら","ねる","ねん","いくた","おごる","とっけん","ついらく","たいけん","けつ","たい","ひょっと","いと","おす","いいん","スト","けん","タイル","おいる","タイトル","るい","たね","けいたい","ごく","ひけつ","つくす","いたく","おつ","ごい","いける","とく","する","いっけん","いる","ひらたい","つらねる","ぎょく","るいすい","いるい","けいひ","たけ","おる","おくらす","いく","オンライン","いん","たすけ","つく","たつ","くら","たんけん","ライス","とくぎ","けらい","たんいつ","けんい","たいけつ","ひとけ","とける","けい","いったい","たいひ","すくい","ねつい"],"orderedTiles":"ねぎおたすょんるつっいくっんとひんいゅいんけらっご"}*/
  
};