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
$gameid = $db->real_escape_string($_POST['gameId']);
$lastKnownId = $db->real_escape_string($_POST['lastKnownId']);
$time = time();
do {
	#Get latest transaction
	$statement = $db->prepare("SELECT `boardtransactid` FROM `boardtransact` WHERE `gameid` = ? AND `boardtransactid` >= ? ORDER BY `boardtransactid` DESC");
	$statement->bind_param('si', $gameid, $lastKnownId);
	$statement->execute();
	$statement->bind_result($transactId);
	$hasRow = $statement->fetch();
	$statement->close();
	$result = array();
	if ($hasRow && $lastKnownId != $transactId){
		break;
	}
	usleep(3000000);
} while((time() - $time) < 15);
if ($hasRow){
	$result["transactId"] = $transactId;
}
else
{
	$result["transactId"] = -1;
}
$result["success"] = 1;

echo json_encode($result);

?>