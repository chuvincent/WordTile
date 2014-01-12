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

$ownership = $db->real_escape_string($_POST['ownership']);
$gameId = $db->real_escape_string($_POST['gameId']);
$submission = $db->real_escape_string($_POST['submission']);
$submissionBy = $db->real_escape_string($_POST['submissionBy']);
$clientLastSubmissionId = $db->real_escape_string($_POST['lastSubmissionId']);
$chat = $db->real_escape_string($_POST['chat']);

#Get the last submission
$statement = $db->prepare("SELECT `boardtransactid`, `submissionby` FROM `boardtransact` WHERE `gameid` = ? ORDER BY boardtransactid DESC");
$statement->bind_param('s', $gameId);
$statement->execute();
$statement->bind_result($serverLastSubmissionId, $serverLastSubmissionBy);
$hasRows = $statement->fetch();
$statement->close();
if ($serverLastSubmissionBy == $submissionBy)
{
	$result = array('error' => "ErrorOutOfSync(0)");
	echo json_encode($result);	
	exit();	
}

#Make sure the client is not out of sync
if (($serverLastSubmissionId == $clientLastSubmissionId) || !$hasRows){
  $stmt = $db->stmt_init();
  if($stmt->prepare("INSERT INTO `boardtransact` (`ownership`, `gameid`, `submission`, `submissionby`, `chat`) VALUES (?, ?, ?, ?,?)")) {
	  $stmt->bind_param('sssss', $ownership, $gameId, $submission, $submissionBy, $chat);
	  $stmt->execute();
	  $stmt->close();
	  #Get the last submission
	  $statement = $db->prepare("SELECT `boardtransactid` FROM `boardtransact` WHERE `gameid` = ? ORDER BY `boardtransactid` DESC");
	  $statement->bind_param('s', $gameId);
	  $statement->execute();
	  $statement->bind_result($serverLastSubmissionId);
	  $statement->fetch();
	  $statement->close();
	  $result = array('success' => 1, 'serverLastSubmissionId'=> $serverLastSubmissionId);
	  echo json_encode($result);
	  exit();
  }
  else
  {
	  $result = array('error' => "ErrorUnknown(1)");
	  echo json_encode($result);	
	  exit();
  }
}
else
{
	$result = array('error' => "ErrorOutOfSync(1)");
	echo json_encode($result);	
	exit();	
}
$result = array('error' => "ErrorUnknown(2)");
echo json_encode($result);	
exit();
?>