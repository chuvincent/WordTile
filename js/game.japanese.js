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


var JapaneseHelper = {
  KATAKANA_TO_HIRAGANA: {
	  "゠":"぀",
	  "ァ":"ぁ",
	  "ア":"あ",
	  "ィ":"ぃ",
	  "イ":"い",
	  "ゥ":"ぅ",
	  "ウ":"う",
	  "ェ":"ぇ",
	  "エ":"え",
	  "ォ":"ぉ",
	  "オ":"お",
	  "カ":"か",
	  "ガ":"が",
	  "キ":"き",
	  "ギ":"ぎ",
	  "ク":"く",
	  "グ":"ぐ",
	  "ケ":"け",
	  "ゲ":"げ",
	  "コ":"こ",
	  "ゴ":"ご",
	  "サ":"さ",
	  "ザ":"ざ",
	  "シ":"し",
	  "ジ":"じ",
	  "ス":"す",
	  "ズ":"ず",
	  "セ":"せ",
	  "ゼ":"ぜ",
	  "ソ":"そ",
	  "ゾ":"ぞ",
	  "タ":"た",
	  "ダ":"だ",
	  "チ":"ち",
	  "ヂ":"ぢ",
	  "ッ":"っ",
	  "ツ":"つ",
	  "ヅ":"づ",
	  "テ":"て",
	  "デ":"で",
	  "ト":"と",
	  "ド":"ど",
	  "ナ":"な",
	  "ニ":"に",
	  "ヌ":"ぬ",
	  "ネ":"ね",
	  "ノ":"の",
	  "ハ":"は",
	  "バ":"ば",
	  "パ":"ぱ",
	  "ヒ":"ひ",
	  "ビ":"び",
	  "ピ":"ぴ",
	  "フ":"ふ",
	  "ブ":"ぶ",
	  "プ":"ぷ",
	  "ヘ":"へ",
	  "ベ":"べ",
	  "ペ":"ぺ",
	  "ホ":"ほ",
	  "ボ":"ぼ",
	  "ポ":"ぽ",
	  "マ":"ま",
	  "ミ":"み",
	  "ム":"む",
	  "メ":"め",
	  "モ":"も",
	  "ャ":"ゃ",
	  "ヤ":"や",
	  "ュ":"ゅ",
	  "ユ":"ゆ",
	  "ョ":"ょ",
	  "ヨ":"よ",
	  "ラ":"ら",
	  "リ":"り",
	  "ル":"る",
	  "レ":"れ",
	  "ロ":"ろ",
	  "ヮ":"ゎ",
	  "ワ":"わ",
	  "ヰ":"ゐ",
	  "ヱ":"ゑ",
	  "ヲ":"を",
	  "ン":"ん",
	  "ヴ":"ゔ",
	  "ヵ":"ゕ",
	  "ヶ":"ゖ",
	  "ヷ":"゗",
	  "ヸ":"゘",
	  "ヹ":"゙",
	  "ヺ":"゚",
	  "・":"゛",
	  "ー":"゜",
	  "ヽ":"ゝ",
	  "ヾ":"ゞ",
	  "ヿ":"ゟ"
  },
  
  convertToHiragana: function(word){
	  var toReturn = "";
	  for (var i = 0; i< word.length; i++){
		  var theChar = word.charAt(i);
		  if (theChar in  JapaneseHelper.KATAKANA_TO_HIRAGANA){
		  	toReturn += JapaneseHelper.KATAKANA_TO_HIRAGANA[theChar];
		  }
		  else
		  {
			toReturn += theChar;
		  }
	  }
	  return toReturn;
  }
};