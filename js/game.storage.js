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

var GameStorage = {
  testStorage: function()
  {
	  try {
		// Try and catch quota exceeded errors
		sessionStorage.setItem("GameStorageTestStorageTest", '1');
		sessionStorage.removeItem("GameStorageTestStorageTest");
		return true;
	  } catch (error) {
		  if (error.code === DOMException.QUOTA_EXCEEDED_ERR && sessionStorage.length === 0)
			  return false;
		  else throw error;
	  }
  },
  
  pageStorage : {},
  
  ownershipArray: [],
	
  setStorageProperty: function (storage, gameId, propName, propValue)
  {
	  var theDict = {}
	  if (storage[gameId] && storage[gameId] != "{}")
	  {
		  theDict =  JSON.parse(storage[gameId]);
	  }
	  theDict[propName] = propValue;
	  //console.log(theDict);
	  storage[gameId] = JSON.stringify(theDict);
  }, 
  
  getStorageProperty: function (storage, gameId, propName)
  {
	  var theDict = {}
	  if (storage[gameId] && storage[gameId] != "{}")
	  {
		  theDict =  JSON.parse(storage[gameId]);
	  }
	  return theDict[propName];
  },
  
  
  storePlayerInfo: function (gameId, playerName, playerId, permanent)
  {
	  if (permanent){
		  GameStorage.setStorageProperty(localStorage, gameId, "playerName", playerName);
		  GameStorage.setStorageProperty(localStorage, gameId, "playerId", playerId);
	  }
	  GameStorage.pageStorage["playerName"] = playerName;
  	  GameStorage.pageStorage["playerId"] = playerId;
  },
  
  storeOpponentFbId: function (opponentFbId)
  {
	  GameStorage.pageStorage["opponentFbId"] = opponentFbId;
  },
  
  getOpponentFbId: function ()
  {
	  return GameStorage.pageStorage["opponentFbId"];
  },
  
  storeBoardInfo: function (gameId, boardConfigInfo)
  {
	  GameHelper.consoleLog("storeBoardInfo");
	  localStorage[gameId+"_board"] = JSON.stringify(boardConfigInfo);
  },
  
  getBoardInfoCache: null,  
  
  getBoardInfo: function (gameId)
  {
	  if (!GameStorage.getBoardInfoCache)
	  {
	  	GameStorage.getBoardInfoCache = JSON.parse(localStorage[gameId+"_board"]); 
	  }
	  return GameStorage.getBoardInfoCache;
  },
  
  hasBoardInfo: function (gameId)
  {
	  var k = gameId+"_board";
	  return (localStorage[k] && localStorage[k] != "{}");
  },
  
  storeBoardTransact: function (gameId, boardTransact)
  {
	  GameHelper.consoleLog(boardTransact);
	  localStorage[gameId+"_transact"] = JSON.stringify(boardTransact);
  },

  getBoardTransact: function (gameId)
  {
	  if (GameStorage.hasBoardTransact(gameId)){
	  	return JSON.parse(localStorage[gameId+"_transact"]); 
	  }
	  return {};
  },
  
  hasBoardTransact: function (gameId)
  {
	  var k = gameId+"_transact";
	  return (localStorage[k] && localStorage[k] != "{}");
  },
  
  getLastKnownTransactionId: function(gameId)
  {
	  var transact = GameStorage.getBoardTransact(gameId);
	  if (transact["transactId"])
	  {
		  return transact["transactId"];
	  }
	  return -1; // if there's no first move, the server is supposed to ignore the last known transaction id too
  },
  
  getTimeSinceLastKnownTransact: function(gameId)
  {
	  var transact = GameStorage.getBoardTransact(gameId);
	  if (transact["lastMoveDatetime"])
	  {
		  var lastDateTime = transact["lastMoveDatetime"];
		  // Split timestamp into [ Y, M, D, h, m, s ]
		  var t = lastDateTime.split(/[- :]/);
		  // Apply each element to the Date function
		  var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
		  // in minutes
		  var diff = (Date.now() - d)/1000/60;
		  return diff;
	  }
	  return Date.now()/1000/60;
  },
  
  getPropertyFromEitherStorage: function (gameId, prop)
  {
	  if (GameStorage.pageStorage[prop])
	  {
		  return GameStorage.pageStorage[prop];
	  }
	  var fromLocal = GameStorage.getStorageProperty(localStorage, gameId, prop);
	  return fromLocal;
  },
  
  getPlayerId: function (gameId)
  {
	  return GameStorage.getPropertyFromEitherStorage(gameId, "playerId");
  },
  
  getPlayerName: function (gameId)
  {
	  return GameStorage.getPropertyFromEitherStorage(gameId, "playerName");
  },
  
  setLastNudgeViaFacebook: function(gameId, atTransactionId)
  {
	  GameStorage.setStorageProperty(localStorage, gameId, "lastNudgeViaFacebook", atTransactionId);
  },
  
  getLastNudgeViaFacebook: function(gameId)
  {
	  return GameStorage.getPropertyFromEitherStorage(gameId, "lastNudgeViaFacebook");
  }
};