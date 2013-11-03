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

var loaded = false;
var focusX = 0;
var focusY = 0;
var horiz = true;

var prevCells = [];
var currCells = [];
var prevX = focusX;
var prevY = focusY;

//initializes crossword puzzle, called only once
function init(puz) {
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

				if(((y == 0 || z == 0) || (USRgrid[y - 1][z].letter == "#" || USRgrid[y][z - 1].letter == "#")) && USRgrid[y][z].letter != "#") {
					USRgrid[y][z].number = currNum;
					currNum++;
				}
			}	
		}
		calcRange(focusX, focusY);
		//TODO: refine this, used just for cleanliness
		USRgrid[0][0].cColor = "rgb(150, 150, 150)";
	} 
}

function startDraw() {
	//Header
	ctxStage.fillStyle = "rgb(0, 0, 0)";
	ctxStage.font = "30px Arial";
	ctxStage.fillText(title, 10, 30);
	ctxStage.font = "15px Arial";
	ctxStage.fillText("Created by " + author + " on " + date, 10, 50);
	ctxStage.fillText("Difficulty: " + difficulty, 10, 70);

	for(var y = 0; y < USRgrid.length; y++) {
		for(var x = 0; x < USRgrid[y].length; x++) {
			//Grid Boxes
			ctxStage.fillStyle = USRgrid[y][x].cColor;
			ctxStage.fillRect((x*30) + 30, (y*30) + 90, 30, 30);
			//Grid Lines
			ctxStage.fillStyle = "rgb(0, 0, 0)";
			ctxStage.strokeRect((x*30) + 30, (y*30) + 90, 30, 30);
			//Grid Numbers
			ctxStage.font = "10px Arial";
			ctxStage.fillText((USRgrid[y][x].number || " "), (x*30) + 32, (y*30) + 100);
		}
	}
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
	return sets;
}

function checkCell() {
	return (USRgrid[focusY][focusX] === ANSgrid[focusY][focusX]);
}

//redraws canvas based on code and possible secondary #s
function redraw(code, secondary) {
	prevX = focusX;
	prevY = focusY;
	if(code === 1) {	//Change of letter
		if(horiz && focusX != 14 && USRgrid[focusY][focusX + 1].letter != "#") {	
			focusX++;
		} else if(!horiz && focusY != 14 && USRgrid[focusY + 1][focusX].letter != "#") {		
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
	}
	
	USRgrid[prevY][prevX].cColor   = "rgb(255, 255, 255)";
	USRgrid[focusY][focusX].cColor = "rgb(150, 150, 150)";

	console.log("Prev: (" + prevX + ", " + prevY + ")");
	console.log("Focus: (" + focusX + ", " + focusY + ")");

	for(var a = 0; a < prevCells.length; a++) {
		replicateCell(prevCells[a][0], prevCells[a][1])
	}

	replicateCell(prevX, prevY);

	for(var b = 0; b < currCells.length; b++) {
		replicateCell(currCells[b][0], currCells[b][1])
	}

	replicateCell(focusX, focusY);
}

//Updates a cell based on USRgrid[y][x] element properties
function replicateCell(x, y) {
	ctxStage.clearRect((x*30) + 30, (y*30) + 90, 30, 30);

	ctxStage.fillStyle = USRgrid[y][x].cColor;
	ctxStage.fillRect((x*30) + 30, (y*30) + 90, 30, 30);

	ctxStage.fillStyle = "rgb(0, 0, 0)";
	ctxStage.strokeRect((x*30) + 30, (y*30) + 90, 30, 30);

	console.log(USRgrid[1][0].cColor);

	ctxStage.fillStyle = USRgrid[y][x].lColor;
	ctxStage.font = "20px Arial";
	ctxStage.fillText(USRgrid[y][x].letter, (x*30) + 38, (y*30) + 115);

	console.log(USRgrid[y][x].letter);

	ctxStage.font = "10px Arial";
	ctxStage.fillText((USRgrid[y][x].number || " "), (x*30) + 32, (y*30) + 100);
}

//Calculates a range of values - array represents a word in the puzzle
function calcRange(x, y) {
	prevCells = currCells;
	currCells = [];
	if(horiz) {
		var tempX = x;
		while(tempX > 0 && USRgrid[y][tempX - 1].letter != "#") {
			tempX--;
		} 
		while(tempX < 14 && USRgrid[y][tempX].letter != "#") {
			currCells.push([tempX, y]);
			tempX++;
		}
	} else {
		var tempY = y;
		while(tempY > 0 && USRgrid[tempY - 1][x].letter != "#") {
			tempY--;
		} 
		while(tempY < 14 && USRgrid[tempY][x].letter != "#") {
			console.log(tempY);
			currCells.push([x, tempY]);
			tempY++;
		}
	}

	for(var a = 0; a < prevCells.length; a++) {
		USRgrid[prevCells[a][1]][prevCells[a][0]].cColor = "rgb(255, 255, 255)";
	}
	for(var b = 0; b < currCells.length; b++) {
		USRgrid[currCells[b][1]][currCells[b][0]].cColor = "rgb(200, 200, 200)";
	}

	redraw(0);
}
 
//Key events
window.onkeydown = function(e) {
	var key = e.keyCode;

	console.log(key);
	if(key == 38) {	//Up
		if(focusY != 0 && USRgrid[focusY - 1][focusX].letter != "#") {
			redraw(2, -1);
		}
	} else if(key == 37) {	//Left
		if(focusX != 0 && USRgrid[focusY][focusX - 1].letter != "#") {
			redraw(3, -1);
		}
	} else if(key == 40) {	//Down
		if(focusY != 14 && USRgrid[focusY + 1][focusX].letter != "#") {
			redraw(2, 1);
		}
	} else if(key == 39) {	//Right
		if(focusX != 14 && USRgrid[focusY][focusX + 1].letter != "#") {
			redraw(3, 1);
		}
	} else if(key == 32) {	//Space
		horiz = !horiz;
		calcRange(focusX, focusY);

	} else if(key >= 65 && key <= 90) {	//Any letter key
		USRgrid[focusY][focusX]["letter"] = String.fromCharCode(key);
		redraw(1);
	}
}