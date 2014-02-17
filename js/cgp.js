/*******************\
| Cartesian Genetic |
|    Programming    |
| Evolutionary Art  |
| @author Anthony   |
| @version 0.1      |
| @date 2014/02/16  |
| @edit 2014/02/17  |
\*******************/

/**********
 * config */
var humanFitness = false;
var numGens = 10000;
var drawEvery = 50;
var numTrainingPoints = 50;

var seedBeing = new CGPBeing(2, 8, 5, 3);

var border = 8;
var numcellsy = 2;
var numcellsx = 3;

var canvasScale = 4;
var canvasWidth = 200;
var canvasHeight = 120;

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;
var trainingData;
var handler;

/******************
 * work functions */
function initCGPEvoArt() {
	canvas = $('#canvas');
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	canvas.style.width = (canvas.width*canvasScale)+'px';
	canvas.style.height = (canvas.height*canvasScale)+'px';
	ctx = canvas.getContext('2d');
	trainingData = [];
	
	if (humanFitness) {
		///////////////////////////////////////////////////////////////////////////
		//grid of randomly generated images (2 input CGPs -> 3 RGB outputs % 256)//
		var pop = [seedBeing];
		for (var ai = 1; ai < numcellsy*numcellsx; ai++) pop.push(pop[0].mutate());
		updateCanvas(pop);
		canvas.addEventListener('mousedown', function(e) {
			var loc = getMousePos(e);
			var celly = Math.floor(numcellsy*loc[1]/canvas.height);
			var cellx = Math.floor(numcellsx*loc[0]/canvas.width);
			var which = celly*numcellsx + cellx;
			pop = [pop[which]];
			for (var ai = 1; ai < numcellsy*numcellsx; ai++) {
				pop.push(pop[0].mutate());
			}
			updateCanvas(pop);
		}, false);
	} else {
		handler = new Handler(1, 6, seedBeing);
		getPixelsFromImage('image.png', function(data, width, timeTaken) {
			//load some random points as training data
			var numPixels = data.length/4;
			for (var ti = 0; ti < numTrainingPoints; ti++) {
				var x = getRandNum(0, width);
				var y = getRandNum(0, numPixels/width);
				var idx = 4*(y*width+x);
				var r = data[idx];
				var g = data[idx+1];
				var b = data[idx+2];
				trainingData.push([x, y, r, g, b]);
			}

			//evolve
			var ai = 0;
			var asyncLoopGens = function(callback) {
				//inner loop work
				var currentBest = handler.step();
				if (handler.currentGen%drawEvery === 0) {
					paintCGPBeing(currentBest, 0, canvas.height, 0, canvas.width);
				}
				ai += 1;
				setTimeout(function() { callback(true); }, 6);
			};
			asyncLoop(numGens,
				function(loop) {
					asyncLoopGens(function(keepGoing) {
						if (keepGoing) loop.next();
						else loop.break();
					})
				}, 
				function() { /* inner loop finished */ }
			);
		});		
	}
}

function updateCanvas(generators) {
	var yunit = Math.floor((canvas.height-(numcellsy-1)*border)/numcellsy); 
	var xunit = Math.floor((canvas.width-(numcellsx-1)*border)/numcellsx);

	var ai = 0;
	var asyncLoopYCells = function(callback) { 
		//outer loop work
		var bi = 0;
		var asyncLoopXCells = function(callback) {
			//inner loop work
			var currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			var which = ai*numcellsx + bi;
			paintCGPBeing(
				generators[which], 
				ai*(yunit+border), ai*(yunit+border)+yunit, 
				bi*(xunit+border), (bi)*(xunit+border)+xunit
			);
			bi += 1;
			setTimeout(function() { callback(true); }, 6); 
		};
		asyncLoop(numcellsx,
			function(loop) {
				asyncLoopXCells(function(keepGoing) {
					if (keepGoing) loop.next();
					else loop.break();
				})
			}, 
			function() { //inner loop finished
				ai += 1;
				setTimeout(function() { callback(true); }, 6); //call outer
			}
		);
	};
	asyncLoop(numcellsy,
		function(loop) {
			asyncLoopYCells(function(keepGoing) {
				if (keepGoing) loop.next();
				else loop.break();
			})
		},
		function() { /* outer loop finished */ }
	);
}

function paintCGPBeing(generator, ys, ye, xs, xe) {
	var currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (var yi = ys; yi < ye; yi++) {
		for (var xi = xs; xi < xe; xi++) {
			var res = generator.evaluate(
				[xi-xs, yi-ys]
			);
			var idx = 4*(yi*canvas.width + xi);
			currImageData.data[idx+0] = res[0]%256;
			currImageData.data[idx+1] = res[1]%256;
			currImageData.data[idx+2] = res[2]%256;
			currImageData.data[idx+3] = 255;
		}
	}
	ctx.putImageData(currImageData, 0, 0);
}

/********************
 * helper functions */
function getPixelsFromImage(location, callback) { //returns array of pixel colors in the image
	var timeStartedGettingPixels = new Date().getTime();
	var img = new Image(); //make a new image
	img.onload = function() { //when it is finished loading
		var canvas = document.createElement('canvas'); //make a canvas element
		canvas.width = img.width; //with this width
		canvas.height = img.height; //and this height (keep it the same as the image)
		canvas.style.display = 'none'; //hide it from the user
		document.body.appendChild(canvas); //then add it to the document's body
		var ctx = canvas.getContext('2d'); //now get the context
		ctx.drawImage(img, 0, 0, img.width, img.height); //so that you can draw the image
		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); //and grab its pixels
		document.body.removeChild(canvas); //all done, so get rid of it
		
		//...all so you can send the pixels, width, and the time taken to get them back through the callback
		var ret = [];
		for (var ai = 0; ai < imageData.data.length; ai++) ret.push(imageData.data[ai]); //annoying copy so the array can be edited
		callback(ret, img.width, new Date().getTime() - timeStartedGettingPixels); 
	};

	img.src = location; //load the image
}

//stolen from http://stackoverflow.com/questions/4288759/asynchronous-for-cycle-in-javascript
function asyncLoop(iterations, func, callback) {
	var index = 0;
	var done = false;
	var loop = {
		next: function() {
			if (done) return;
			if (index < iterations) {
				index += 1;
				func(loop);
			} else {
				done = true;
				if (callback) callback();
			}
		},
		iteration: function() {
			return index - 1;
		},
		break: function() {
			done = true;
			if (callback) callback();
		}
	};
	loop.next();
	return loop;
}

function getMousePos(e) {
	var rect = canvas.getBoundingClientRect();
	return [(e.clientX-rect.left)/canvasScale, (e.clientY-rect.top)/canvasScale];
}

function $(sel) {
	if (sel.charAt(0) === '#') return document.getElementById(sel.substring(1));
	else return false;
}

function currentTimeMillis() {
	return new Date().getTime();
}

function getRandNum(lower, upper) { //returns number in [lower, upper)
	return Math.floor((Math.random()*(upper-lower))+lower);
}

/***********
 * objects */
function Handler(numIslands, popSize, seedIndividual, logEvery) {
	this.currentGen = 0;
	this.islands = [];
	this.popSize = popSize;
	for (var ai = 0; ai < numIslands; ai++) {
		this.islands.push(new Island(popSize, seedIndividual));
	}
	this.logEvery = logEvery || 50;
	this.timeElapsed = 0;

	this.step = function() {
		this.currentGen += 1;
		var start = currentTimeMillis();

		//////////////////////////
		//evolve all the islands//
		var currentBests = [];
		for (var ai = 0; ai < this.islands.length; ai++) {
			//evolve and get the current best solution and its score
			currentBests.push(this.islands[ai].evolve()); 
		}
		var currentBest = [null, Math.pow(2, 2000), ''];
		for (var ai = 0; ai < this.islands.length; ai++) {
			if (currentBests[ai][1] <= currentBest[1]) {
				currentBest = currentBests[ai];
			}
		}

		/////////////
		//reporting//
		var duration = currentTimeMillis() - start;
		this.timeElapsed += duration;
		if (this.currentGen%this.logEvery === 0) {
			var avgDuration = this.timeElapsed/this.currentGen;
			console.log('Generation #' + this.currentGen + '\n' + 
						'Score: ' + currentBest[1] + '\n' +
						'Duration: ' + duration + 'ms, ' + 
							'Avg: ' + avgDuration + 'ms, ' + 
							'Total: ' + this.timeElapsed + 'ms\n' +
						'Solution: ' + currentBest[2] + '\n'
			);
		}

		return currentBest[0];
	};
}

function Island(popSize, seedIndividual) {
	this.popSize = popSize;
	this.population = [seedIndividual];

	//////////////////
	//work functions//
	this.evolve = function() {
		var selection = this.choose();
		var newPopulation = [];
		newPopulation.push(selection);
		for (var ai = 1; ai < this.popSize; ai++) {
			newPopulation.push(selection.mutate());
		}

		this.population = newPopulation;
		return [selection, selection.getFitness(), selection.squish()];
	};

	this.choose = function() {
		var scores = [this.population[0].getFitness()];
		var selection = this.population[0];
		for (var ai = 1; ai < this.population.length; ai++) {
			scores[ai] = this.population[ai].getFitness();
			if (scores[ai] <= scores[0]) { //the "or equals" in <= is very important!
				selection = this.population[ai];
			}
		}
		return selection;
	};
}

function CGPBeing(numInputs, cols, rows, numOutputs, genes) {
	this.numInputs = numInputs || 2;
	this.cols = cols || 4;
	this.rows = rows || 3;
	this.numOutputs = numOutputs || 3;
	this.genes = arguments.length === 5 ? genes : getRandGenes(
		this.numInputs, this.cols, this.rows, this.numOutputs
	);

	this.getFitness = function() {
		var score = 0.1;
		var colorsSeen = [];
		for (var ai = 0; ai < trainingData.length; ai++) {
			var guess = this.evaluate([trainingData[ai][0], trainingData[ai][1]]);
			score += Math.sqrt(
				Math.pow(trainingData[ai][2] - guess[0], 2) +
				Math.pow(trainingData[ai][3] - guess[1], 2) +
				Math.pow(trainingData[ai][4] - guess[2], 2)
			);
		}
		return score;
	};

	this.evaluate = function(inputs) {
		var values = [];
		for (var ai = 0; ai < this.numInputs; ai++) values.push(inputs[ai]);

		for (var ai = 0; ai < this.cols; ai++) { //for each column
			for (var bi = 0; bi < this.rows; bi++) { //each row in that column
				var idx = ai*this.rows + bi;
				values.push(
					cgpFunc(
						this.genes[idx][0], //function id
						[values[this.genes[idx][1]], values[this.genes[idx][2]]] //inputs
					)
				); //evaluate the node at (col, row)
			}
		}

		var ret = [];
		var numGenes = this.genes.length;
		for (var ai = numGenes-this.numOutputs; ai < numGenes; ai++) {
			ret.push(values[this.genes[ai]]); //gather up all the outputs
		}
		return ret;
	};

	this.mutate = function() {
		var ret = new CGPBeing(this.numInputs, this.cols, this.rows, this.numOutputs);
		var mutatedGenes = [];
		var numGenes = this.genes.length;
		var mutRate = 0.03;
		for (var ai = 0; ai < numGenes-this.numOutputs; ai++) {
			var currentGene = [];
			for (var bi = 0; bi < 3; bi++) {
				if (Math.random() < mutRate) {
					var col = ai/this.numRows;
					switch (bi) {
						case 0:
							currentGene.push(getRandFunctionId());
							break;
						default:
							currentGene.push(
								getRandInputId(col, this.numInputs, this.numRows)
							);
							break;
					}
				} else {
					currentGene.push(this.genes[ai][bi]);
				}
			}
			mutatedGenes.push(currentGene);
		}
		for (var ai = numGenes-this.numOutputs; ai < numGenes; ai++) {
			if (Math.random() < mutRate) {
				mutatedGenes.push(getRandInputId(this.cols, this.numInputs, this.rows));
			} else {
				mutatedGenes.push(this.genes[ai]);
			}
		}

		ret.genes = mutatedGenes;
		return ret;
	};

	this.squish = function() {
		//btoa([1,2,0.2145566]) = "MSwyLDAuMjE0NTU2Ng=="
		//atob("MSwyLDAuMjE0NTU2Ng==").split(",").map(parseFloat) = [1,2,0.2145566]
		return btoa(this.genes);
	};

	function getRandFunctionId() {
		return getRandNum(0, 256); 
	}

	function getRandInputId(col, numInputs, rows) { 
		return getRandNum(0, col*rows+numInputs);
	}

	function getRandGenes(numInputs, cols, rows, numOutputs) {
		var ret = [];
		for (var ai = 0; ai < cols; ai++) { //for each column
			for (var bi = 0; bi < rows; bi++) { //each row in that column
				ret.push([getRandFunctionId(),
						  getRandInputId(ai, numInputs, rows), 
						  getRandInputId(ai, numInputs, rows)]); //add genes
			}
		}
		for (var ai = 0; ai < numOutputs; ai++) { //assign the output nodes
			ret.push(getRandInputId(cols, numInputs, rows));
		}
		return ret;
	}
}

window.addEventListener('load', function() {
	initCGPEvoArt();
});