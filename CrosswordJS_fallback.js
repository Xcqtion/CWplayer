var req = new XMLHttpRequest();
req.overrideMimeType("text/plain");

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

		for(var x = 0; x < data[4].length; x++) {
			ANSgrid.push(data[4][x].split(""));	
		}

		for(var y = 0; y < ANSgrid.length; y++) {
			USRgrid.push([]);
			for(var z = 0; z < ANSgrid[y].length; z++) {
				if(ANSgrid[y][z] == "#") {
					USRgrid[y][z] = "#";
				} else {
					USRgrid[y][z] = " ";
				}
			}	
		}
	}
}

//Main drawing method; draws grid et al.
function draw() {
	var can = document.getElementById("stage");
	if(can.getContext) {
		var ctx = can.getContext("2d");

		if(!loaded) {
			init(1);
		}
		
		console.log("(" + focusX + ", " + focusY + ")");
		//BKGD
		ctx.fillStyle = "rgb(50, 255, 50)";
		ctx.fillRect(0, 0, 700, 700);

		//Grid
		var sqNum = 1;
		for(var y = 0; y < USRgrid.length; y++) {
			for(var x = 0; x < USRgrid[y].length; x++) {
				//Grid Boxes
				if(USRgrid[y][x] == "#") {
					ctx.fillStyle = "rgb(0, 0, 0)";
				} else if(y == focusY && x == focusX) {
					ctx.fillStyle = "rgb(0, 0, 220)";
				} else if((horiz && y == focusY && !(USRgrid[y].slice(Math.min(focusX, x + 1), Math.max(focusX, x + 1)).indexOf("#") + 1)) ||
							(!horiz && x == focusX && (function(focus, vbl) {
								var tempArr = [];
								for(a = 0; a < USRgrid.length; a++) {
									tempArr.push(USRgrid[a][focusX]);
								}
								return !(tempArr.slice(Math.min(focus, vbl), Math.max(focus, vbl)).indexOf("#") + 1);
							})(focusY, y + 1))) {	//TODO: Here pls
					ctx.fillStyle = "rgb(100, 0, 0)";
				} else {
					ctx.fillStyle = "rgb(255, 255, 255)";
				}
				ctx.fillRect((x*30) + 30, (y*30) + 90, 30, 30);

				//Letters on Grid
				ctx.font = "20px Arial";
				ctx.fillStyle = "rgb(0, 0, 0)";
				if(USRgrid[y][x] != "#" && USRgrid[y][x] != " ") {
					ctx.fillText(USRgrid[y][x], (x*30) + 40, (y*30) + 115);
				}


				//Gridlines
				ctx.fillStyle = "rgb(0, 0, 0)";
				ctx.strokeRect((x*30) + 30, (y*30) + 90, 30, 30);

				//Numbers on Grid
				ctx.font = "10px Arial";
				if(((y == 0 || x == 0) || (USRgrid[y - 1][x] == "#" || USRgrid[y][x - 1] == "#")) && USRgrid[y][x] != "#") {
					ctx.fillText(sqNum, (x*30) + 32, (y*30) + 100);
					sqNum++;
				}
			}	
		}

		//Header
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.font = "30px Arial";
		ctx.fillText(title, 10, 30);
		ctx.font = "15px Arial";
		ctx.fillText("Created by " + author + " on " + date, 10, 50);
		ctx.fillText("Difficulty: " + difficulty, 10, 70);


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

window.onkeydown = function(e) {
	var key = e.keyCode;

	console.log(key);
	if(key == 38) {	//Up
		if(focusY != 0 && USRgrid[focusY - 1][focusX] != "#") {
			focusY--;
		}
	} else if(key == 37) {	//Left
		if(focusX != 0 && USRgrid[focusY][focusX - 1] != "#") {
			focusX--;
		}
	} else if(key == 40) {	//Down
		if(focusY != 14 && USRgrid[focusY + 1][focusX] != "#") {
			focusY++;
		}
	} else if(key == 39) {	//Right
		if(focusX != 14 && USRgrid[focusY][focusX + 1] != "#") {
			focusX++;
		}
	} else if(key == 32) {
		horiz = !horiz;
	} else if(key >= 65 && key <= 90) {
		USRgrid[focusY][focusX] = String.fromCharCode(key);
		if(horiz && focusX != 14 && USRgrid[focusY][focusX + 1] != "#") {
			focusX++;
		} else if(!horiz && focusY != 14 && USRgrid[focusY + 1][focusX] != "#") {
			focusY++;
		}
	}

	draw();
}