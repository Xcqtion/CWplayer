var req = new XMLHttpRequest();
req.overrideMimeType("text/plain");

//letter; letter in the cell - space is no letter, hash is black space
//number; num indicator in cell - space for none
//lColor; color of letter
//cColor; color of cell
function Cell(letter, number, lColor, cColor) {
	this.letter = letter;
	this.number = number;
	this.lColor = lColor;
	this.cColor = cColor;
}

var ctxStage;

var title  		= null;
var author 		= null;
var date   		= null;
var difficulty  = null;

var ACRclues	= [];
var DOWclues	= [];

var USRgrid	 	= [];
var ANSgrid		= [];

var CorrectAcrossQuestions	= {};
var CorrectDownQuestions	= {};

var loaded = false;
var focusX = 0;
var focusY = 0;
var horiz = true;
var activeNum = 1;
var isEditing = false;

var prevCells = [];
var currCells = [];
var prevX = focusX;
var prevY = focusY;

var time = [0, -1];
var stopper = setInterval(redrawTimer, 1000);
var isStopped = false;

var black = "rgb(0, 0, 0)";			//Black
var gray = 	"rgb(150, 150, 150)";	//Gray
var lGray =	"rgb(175, 175, 175)";	//Light Gray
var wGray = "rgb(200, 200, 200)";	//White Gray
var white = "rgb(255, 255, 255)";	//White

//initializes crossword puzzle, called only once
function init(puz) {
	///////
	WebFontConfig = {
	    google: { families: [ 'Sintony:400,700:latin', 'Just+Me+Again+Down+Here::latin' ] }
	  };
	  (function() {
	    var wf = document.createElement('script');
	    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
	      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
	    wf.type = 'text/javascript';
	    wf.async = 'true';
	    var s = document.getElementsByTagName('script')[0];
	    s.parentNode.insertBefore(wf, s);
	  })();
	///////
	var data;
	data = getCW(puz);
	
	if(data != undefined) {
		data = parse(data);

		title =		 data[0][0];
		author =	 data[1][0];
		date =		 data[2][0];
		difficulty = data[3][0];

		ACRclues = data[5];
		DOWclues = data[6];

		var currNum = 1;
		for(var y = 0; y < data[4].length; y++) {
			ANSgrid.push([]);
			USRgrid.push([]);
			for(var z = 0; z < data[4][y].length; z++) {
				ANSgrid[y][z] = new Cell(data[4][y].charAt(z), null, "rgb(0, 0, 0)", (data[4][y].charAt(z) == "#" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)"));
				USRgrid[y][z] = new Cell((ANSgrid[y][z].letter == "#" ? "#" : " "), null, "rgb(0, 0, 0)", ANSgrid[y][z].cColor);
				if(((y === 0 || z === 0) || (USRgrid[y - 1][z].letter == "#" || USRgrid[y][z - 1].letter == "#")) && USRgrid[y][z].letter != "#") {
					USRgrid[y][z].number = currNum;
					currNum++;
				}
			}	
		}
		calcRange(focusX, focusY);
		//TODO: refine this, used just for cleanliness
		USRgrid[0][0].cColor = "rgb(150, 150, 150)";

		document.getElementById("AcrossQuestions").innerHTML += "<h1>Across Clues</h1>"
		for (var i = 0; ACRclues.length - 1 > i; i++) {
			var clue = ACRclues[i];
			clue = clue.split(". ");
			var number = clue[0];
			clue = clue[1];
			document.getElementById("AcrossQuestions").innerHTML += '<li id="' + 'A' + number + '"><span>'+ number + "<span>" + clue + "</li>";
		};
		document.getElementById("DownQuestions").innerHTML += "<h1>Down Clues</h1>"
		for (var i = 0; DOWclues.length - 1 > i; i++) {
			var clue = DOWclues[i];
			clue = clue.split(". ");
			var number = clue[0];
			clue = clue[1];
			document.getElementById("DownQuestions").innerHTML += '<li id="' + 'D' + number + '"><span>'+ number + "<span>" + clue + "</li>";
		};
		
		redrawTimer();
		
	} 
}

var minimumView = false,
	showTimer = false,
	xOffset = 30,
	yOffset = 90;
if(minimumView) {
	xOffset = 0; yOffset = 0;
}

//Initializes drawing on canvas
function startDraw() {
	//Header
	ctxStage.fillStyle = "rgb(0, 0, 0)";
	ctxStage.font = "30px Sirin Stencil";
	ctxStage.fillText(title, 10, 30);
	ctxStage.font = "15px Sirin Stencil";
	ctxStage.fillText("Created by " + author + " on " + date, 10, 50);
	ctxStage.fillText("Difficulty: " + difficulty, 10, 70);


	for(var y = 0; y < USRgrid.length; y++) {
		for(var x = 0; x < USRgrid[y].length; x++) {
			//Grid Boxes
			ctxStage.fillStyle = USRgrid[y][x].cColor;
			ctxStage.fillRect((x*30) + xOffset, (y*30) + yOffset, 30, 30);
			//Grid Lines
			ctxStage.fillStyle = "rgb(0, 0, 0)";
			ctxStage.strokeRect((x*30) + xOffset, (y*30) + yOffset, 30, 30);
			//Grid Numbers
			ctxStage.font = "10px Arial";
			ctxStage.fillText((USRgrid[y][x].number || " "), (x*30) + xOffset + 2, (y*30) + yOffset + 10);
		}
	}

	ctxStage.fillStyle = gray;
	ctxStage.fillRect(30, 570, 120, 30);
	ctxStage.fillRect(30, 615, 120, 30);
	ctxStage.fillStyle = "rgb(0, 150, 0)";
	ctxStage.font = "20px Arial";
	ctxStage.fillText("Across", 35, 592);
	ctxStage.fillText("Down", 35, 637);
}

//Main drawing method; draws grid et al.
function draw() {
	var can = document.getElementById("stage");
	if(can.getContext) {
		ctxStage = can.getContext("2d");

		if(!loaded) {
			init(1);
			startDraw();
		} 

	} else {
		console.log("This browser does not support canvas!");
	}
}

//Retrieves text file, returns contents of text file
function getCW(puz) {
	req.open("GET", "cw_" + puz + ".txt", false);
	req.send(null);
	loaded = true;
	return req.responseText;
}

//inputs cw_x.txt contents, creates 2d array consisting of
//various attributes of the puzzle (title, author, etc) 
function parse(block) {
	block = block.split(/\r\n/);
	var sets = [];
	var temp = [];

	for(var x = 0; x < block.length; x++) {
		if(block[x] == "$") {
			sets.push(temp);
			temp = [];
		} else {
			temp.push(block[x]);
		}
	}
	sets.push(temp);
	return sets;
}

function checkCell(x, y) {
	return ((USRgrid[y][x].letter != " ")
		 && (USRgrid[y][x].letter != "#") 
		 && (USRgrid[y][x].letter.toUpperCase() === ANSgrid[y][x].letter.toUpperCase()));
}

//redraws canvas based on code and possible secondary #s
function redraw(code, secondary) {
//	ctxStage.fillStyle = "rgb(244, 244, 0)";
//	ctxStage.fillRect(0, 0, 700, 700);
	prevX = focusX;
	prevY = focusY;
	if(code === 1) {	//Change of letter
		if(horiz && focusX != 14 && USRgrid[focusY][focusX + 1].letter != "#" || isEditing) {	
			focusX++;
		} else if(!horiz && focusY != 14 && USRgrid[focusY + 1][focusX].letter != "#" || isEditing) {		
			focusY++;
		}
	} else if (code === 2) {	//Change of position via Up/Down
		focusY += secondary;	
		if(horiz) {
			calcRange(focusX, focusY);
		}
	} else if (code === 3) {	//Change of position via Left/Right
		focusX += secondary;
		if(!horiz) {
			calcRange(focusX, focusY);
		}
	} else if (code === 4) {	//Deletion of letter
		if(horiz && focusX != 0 && USRgrid[focusY][focusX - 1].letter != "#") {
			focusX--;
		} else if(!horiz && focusY != 0 && USRgrid[focusY - 1][focusX].letter != "#") {		
			focusY--;
		}
	} 
	
	//Assumptuous, will fix for new cases
	if (code <= 4) {
		ctxStage.fillStyle = "rgb(175, 175, 175)";
		ctxStage.fillRect(150, 570, 330, 30);
		ctxStage.fillRect(150, 615, 330, 30);
		ctxStage.fillStyle = "rgb(35, 0, 255)";
		ctxStage.font = "15px Arial";
		ctxStage.fillText(getClue(focusX, focusY, true), 155, 588);
		ctxStage.fillText(getClue(focusX, focusY, false), 155, 633);
	}

	if((horiz && prevY === focusY) || (!horiz && prevX === focusX)){
		USRgrid[prevY][prevX].cColor   = "rgb(200, 200, 200)";
	} else {
		USRgrid[prevY][prevX].cColor   = "rgb(255, 255, 255)";
	}
	USRgrid[focusY][focusX].cColor = "rgb(150, 150, 150)";

	for(var a = 0; a < prevCells.length; a++) {
		replicateCell(prevCells[a][0], prevCells[a][1])
	}

	replicateCell(prevX, prevY);

	for(var b = 0; b < currCells.length; b++) {
		replicateCell(currCells[b][0], currCells[b][1])
	}

	replicateCell(focusX, focusY);

	var actives = document.getElementsByClassName("active")
	if(actives.length > 0)
		for (var i = actives.length - 1; i >= 0; i--) {
			actives[i].className =
				actives[i].className.replace(/\bactive\b/,'');
		};
	var acrossActive = getCells(focusX, focusY,true).activeNum
	var acrossActiveElem = document.getElementById("A"+acrossActive)
	if(acrossActiveElem != null) {
		acrossActiveElem.className = 
			acrossActiveElem.className.replace(/\bcorrect\b/,'');
		if(CorrectAcrossQuestions[acrossActive]){
			acrossActiveElem.className += " correct"
		}
	}
	var downActive = getCells(focusX, focusY,false).activeNum
	var downActiveElem = document.getElementById("D"+downActive)
	if(downActiveElem != null) {
		downActiveElem.className = 
			downActiveElem.className.replace(/\bcorrect\b/,'');
		if(CorrectDownQuestions[downActive]){
			downActiveElem.className += " correct"
		}
	}
	var activeQuestion = document.getElementById((horiz?"A":"D") + activeNum)
	if(activeQuestion != null)
		activeQuestion.className += ' active' 
}

//Updates a cell based on USRgrid[y][x] element properties
function replicateCell(x, y) {
	ctxStage.clearRect((x*30) + xOffset, (y*30) + yOffset, 30, 30);

	// Check if cell is in a correct row/column
	var isCorrect = false
	if( CorrectAcrossQuestions[getCells(x,y,true).activeNum]  || CorrectDownQuestions[getCells(x,y,false).activeNum] )
		isCorrect = true
	ctxStage.fillStyle = USRgrid[y][x].cColor;
	ctxStage.fillRect((x*30) + xOffset, (y*30) + yOffset, 30, 30);

	ctxStage.fillStyle = "rgb(0, 0, 0)";
	ctxStage.strokeRect((x*30) + xOffset, (y*30) + yOffset, 30, 30);

	ctxStage.fillStyle = isCorrect?"green":USRgrid[y][x].lColor;
	ctxStage.font = "25px Just Me Again Down Here";
	ctxStage.fillText(USRgrid[y][x].letter, (x*30) + xOffset + 8, (y*30) + yOffset + 25);

	ctxStage.fillStyle = black;
	ctxStage.font = "10px Arial";
	ctxStage.fillText((USRgrid[y][x].number || " "), (x*30) + xOffset + 2, (y*30) + yOffset + 10);
}

function getCells(x,y,across) {
	result = {}
	result.currCells = []

	if(across) {
		var tempX = x;
		while(tempX > 0 && USRgrid[y][tempX - 1].letter != "#") {
			tempX--;
		} 

		result.activeNum = USRgrid[y][tempX].number;

		while(tempX <= 14 && USRgrid[y][tempX].letter != "#") {
			result.currCells.push([tempX, y]);
			tempX++;
		}
	} else {
		var tempY = y;
		while(tempY > 0 && USRgrid[tempY - 1][x].letter != "#") {
			tempY--;
		} 

		result.activeNum = USRgrid[tempY][x].number;

		while(tempY <= 14 && USRgrid[tempY][x].letter != "#") {
			result.currCells.push([x, tempY]);
			tempY++;
		}
	}
	return result
}

//Retrieves clue based on position and orientation
function getClue(x, y, isACR) {
	var targetNum;
	if(isACR) {
		targetNum = getCells(x, y, true).activeNum;
		for(var x = 0; x < ACRclues.length; x++) {
			if(targetNum == ACRclues[x].split(".")[0]) {
				return ACRclues[x];
			}
		}
	} else {
		targetNum = getCells(x, y, false).activeNum;
		for(var x = 0; x < DOWclues.length; x++) {
			if(targetNum == DOWclues[x].split(".")[0]) {
				return DOWclues[x];
			}
		}
	}

	return "Damn it all, this isn't supposed to happen!";
}

//Calculates a range of values - array represents a word in the puzzle
function calcRange(x, y) {
	prevCells = currCells;
	var resultingThese = getCells(x,y,horiz);
	currCells = resultingThese.currCells;
	activeNum = resultingThese.activeNum;

	for(var a = 0; a < prevCells.length; a++) {
		USRgrid[ prevCells[a][1] ][ prevCells[a][0] ].cColor = "rgb(255, 255, 255)";
	}
	for(var b = 0; b < currCells.length; b++) {
		USRgrid[ currCells[b][1] ][ currCells[b][0] ].cColor = "rgb(200, 200, 200)";
	}

	redraw(0);
}

function edit(event) {
	event.target.disabled = !event.target.disabled;
	isEditing = !isEditing;

}

function checkCorrectness() {

	var across = getCells(focusX,focusY,true)
	var down = getCells(focusX,focusY,false)
	var check = [across,down]

	for(var checki = 0; checki < check.length; checki++){
		var cellsToCheck = check[checki]
		var allCorrect = true
		for(var celli = 0; celli < cellsToCheck.currCells.length; celli++){
			cellToCheck = cellsToCheck.currCells[celli]
			if(!checkCell(cellToCheck[0],cellToCheck[1])){
				allCorrect = false;
				break;
			}
		}
		if(checki === 0)
			CorrectAcrossQuestions[cellsToCheck.activeNum] = allCorrect
		if(checki === 1)
			CorrectDownQuestions[cellsToCheck.activeNum] = allCorrect
	}
	redraw(0)
}
/*
function checkColors() {
	console.log(USRgrid.length);
	for(var x = 0; x < USRgrid.length; x++) {
		for(var y = 0; y < USRgrid[x].length; y++) {
			if(checkCell(x, y)) {
				USRgrid[y][x].cColor = "rgb(0, 200, 100)";
				USRgrid[y][x].lColor = "rgb(0, 100, 50)";
			} else {
				USRgrid[y][x].cColor = "rgb(200, 0, 100)";
				USRgrid[y][x].lColor = "rgb(200, 0, 50)";
			}
		}
	}
}*/

function redrawTimer() {
	if(!showTimer)
		return
	time[1]++;
	if(time[1] == 60) {
		time[0]++;
		time[1] = 0;
	}
	ctxStage.clearRect(390, 25, 90, 40);
	ctxStage.font = "700 35px Sintony";
	ctxStage.fillStyle = "rgb(" + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + "," + Math.round(Math.random() * 255) + ")";
	ctxStage.fillText(time[0], (390 - ((time[0].toString().length - 1) * 22.5)), 60);
	ctxStage.font = "400 35px Sintony";
	ctxStage.fillText(":" + (time[1] > 9 ? time[1] : "0" + time[1]), 412.5, 60);	//Width separation: 22.5px assuming 35px font size
}

//Key events
window.onkeydown = function(e) {
	var key = e.keyCode;
	var cancelDefault = true
	console.log(key);
	if(key == 38) {	//Up
		if(focusY != 0 && USRgrid[focusY - 1][focusX].letter != "#" || isEditing) {
			redraw(2, -1);
		}
	} else if(key == 37) {	//Left
		if(focusX != 0 && USRgrid[focusY][focusX - 1].letter != "#" || isEditing) {
			redraw(3, -1);
		}
	} else if(key == 40) {	//Down
		if(focusY != 14 && USRgrid[focusY + 1][focusX].letter != "#" || isEditing) {
			redraw(2, 1);
		}
	} else if(key == 39) {	//Right
		if(focusX != 14 && USRgrid[focusY][focusX + 1].letter != "#" || isEditing) {
			redraw(3, 1);
		}
	} else if(key == 32) {	//Space
		horiz = !horiz;
		calcRange(focusX, focusY);
	} else if(key >= 65 && key <= 90) {	//Any letter key
		USRgrid[focusY][focusX]["letter"] = String.fromCharCode(key);
		redraw(1);
	} else if(key == 8) {	//Backspace
		USRgrid[focusY][focusX].letter = " ";
		redraw(4);
	} else if(key == 46) {	//Delete
		USRgrid[focusY][focusX].letter = " ";
		redraw(0);
	} else if(key == 190 && isEditing) {	//Period
		USRgrid[focusY][focusX].letter = "#";
		redraw(1);
	} else if(key == 192) {	// 	`  <-- That wee bastard
		if(!isStopped) {
			clearInterval(stopper);
		} else {
			stopper = setInterval(redrawTimer, 1000);
		}
		isStopped = !isStopped;
	} else {
		// Did not capture any keys
		cancelDefault = false
	}
	if (cancelDefault) {
		e.preventDefault()
	}
}

window.onkeyup = function(e) { 
if(!isEditing)
	checkCorrectness();
}