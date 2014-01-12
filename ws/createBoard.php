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

function getRandomBoard($language){
	include 'db.php';
	$language = "'".$language."'";
	$offset_result = $db->query( " SELECT FLOOR(RAND() * COUNT(*)) AS `offset` FROM `board` WHERE `language` = " .  $language);
	$offset_row = $offset_result->fetch_object();
	$offset = $offset_row->offset;
	$offset_result->close();
	$result = $db->query( " SELECT `boardid`, `boardtiles` FROM `board` WHERE `language` = " . $language . " LIMIT $offset, 1 " );	
	$result_row = $result->fetch_object();
	$result->close();
	
	return $result_row;
}

function str_shuffle_unicode($str) {
    $tmp = preg_split("//u", $str, -1, PREG_SPLIT_NO_EMPTY);
    shuffle($tmp);
    return join("", $tmp);
}


function createBoard($gameid, $language){
	include 'db.php';
	$board = getRandomBoard($language);
	$boardid = $board->boardid;
	$boardtiles = str_shuffle_unicode($board->boardtiles);
	$stmt = $db->stmt_init();
	if($stmt->prepare("INSERT INTO `boardconfig` (`boardid`, `orderedtiles`, `gameid`) VALUES (?, ?, ?)")) {
		$stmt->bind_param('iss', $boardid, $boardtiles, $gameid);
		$stmt->execute();
		$stmt->close();
	}
}
?>