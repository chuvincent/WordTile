<?php

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

include 'db.php';
include 'createBoard.php';
$username = $db->real_escape_string($_POST['username']);
$password = $db->real_escape_string($_POST['password']);
$gameId = $db->real_escape_string($_POST['gameId']);
$language = $db->real_escape_string($_POST['language']);
$fbUserId = $db->real_escape_string($_POST['fbUserId']);

$statement = $db->prepare("SELECT `localUserId`, `username`, `password` FROM `login` WHERE `gameid` = ?");
$statement->bind_param('s', $gameId);
$statement->execute();
$statement->store_result(); 
$numPlayers = $statement->num_rows;
$players = array();
$statement->bind_result($resultPlayerId, $resultUsername, $resultPassword);
while ($statement->fetch()) {
    if ($username == $resultUsername && $password == $resultPassword)
	{
		// username already exists and password matches
		$result = array('success' => 1, 'playerId' => $resultPlayerId);
		echo json_encode($result);	
		exit();		
	}
	else if ($username == $resultUsername)
	{
		// username matches but password not matches
		$result = array('error' => "ErrorPasswordIncorrectBody");
		echo json_encode($result);	
		exit();
	}
	
}
$statement->free_result();
$statement->close();
if ($numPlayers == 0)
{
	createBoard($gameId, $language);
}

if ($numPlayers >= 2)
{
	$result = array('error' => "ErrorTooManyPlayersBody");
	echo json_encode($result);	
	exit();
}
else // numPlayers == 0 or 1
{
	$stmt = $db->stmt_init();
	if($stmt->prepare("INSERT INTO `login` (`gameid`, `localuserid`, `username`, `password`, `fbuserid`) VALUES (?, ?, ?, ?, ?)")) {
		$newId = $numPlayers+1;
		$stmt->bind_param('sisss', $gameId, $newId, $username, $password, $fbUserId);
		$stmt->execute();
		$stmt->close();
		$result = array('success' => 1, 'playerId'=> $newId);
		echo json_encode($result);	
		exit();
	}
}
$result = array('error' => "Unknown error has occurred");
echo json_encode($result);	
exit();
?>