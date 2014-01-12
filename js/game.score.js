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

var GameScore = {
  SCORE: 
  {
	  en:
	  {
		  'a':1
		  ,'b':3
		  ,'c':3
		  ,'d':2
		  ,'e':1
		  ,'f':4
		  ,'g':2
		  ,'h':4
		  ,'i':1
		  ,'j':8
		  ,'k':5
		  ,'l':1
		  ,'m':3
		  ,'n':1
		  ,'o':1
		  ,'p':3
		  ,'q':10
		  ,'r':1
		  ,'s':1
		  ,'t':1
		  ,'u':1
		  ,'v':4
		  ,'w':4
		  ,'x':8
		  ,'y':4
		  ,'z':10 
	  } 
  },
  
  getTileScore: function(tile, language){
	  try{
		var toReturn = GameScore.SCORE[language][tile];
		if (toReturn){
			return toReturn;
		}
		else {
			return 0;
		}
	  }
	  catch(err){
		  return 0;  
	  }
  }
  
};