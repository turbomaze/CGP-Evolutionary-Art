/*******************\
| Cartesian Genetic |
|    Programming    |
| Evolutionary Art  |
| @author Anthony   |
| @version 0.1      |
| @date 2014/02/16  |
| @edit 2014/02/16  |
\*******************/

/**********
 * config */
var canvasScale = 2;

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;

/******************
 * work functions */
function initCGPEvoArt() {
	canvas = $('#canvas');
	canvas.style.width = (canvas.width*canvasScale)+'px';
	canvas.style.height = (canvas.height*canvasScale)+'px';
	ctx = canvas.getContext('2d');
	
	///////////////////////////////////////////////////////////////////////////
	//grid of randomly generated images (2 input CGPs -> 3 RGB outputs % 256)//
	var border = 8;
	var numcellsy = 2;
	var numcellsx = 3;
	var OG = new CGPBeing(2, 10, 10, 3);
	var pop = updateCanvas(OG, numcellsy, numcellsx, border);
	canvas.addEventListener('mousedown', function(e) {
		var loc = getMousePos(e);
		var celly = Math.floor(numcellsy*loc[1]/canvas.height);
		var cellx = Math.floor(numcellsx*loc[0]/canvas.width);
		var which = celly*numcellsx + cellx;
		pop = updateCanvas(pop[which], numcellsy, numcellsx, border);
	}, false);
}

function updateCanvas(generator, numcellsy, numcellsx, border) {
	var ret = [];
	var yunit = Math.floor((canvas.height-(numcellsy-1)*border)/numcellsy); 
	var xunit = Math.floor((canvas.width-(numcellsx-1)*border)/numcellsx);
	var imageGenerator = generator;
	
	var ai = 0;
	var asyncLoopYCells = function(callback) { 
		//outer loop work
		var bi = 0;
		var asyncLoopXCells = function(callback) {
			//inner loop work
			var currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			ret.push(imageGenerator);
			for (var yi = ai*(yunit+border); yi < (ai)*(yunit+border)+yunit; yi++) {
				for (var xi = bi*(xunit+border); xi < (bi)*(xunit+border)+xunit; xi++) {
					var res = imageGenerator.evaluate(
						[xi-bi*(xunit+border), yi-ai*(yunit+border)]
					);
					var idx = 4*(yi*canvas.width + xi);
					currImageData.data[idx+0] = res[0]%256;
					currImageData.data[idx+1] = res[1]%256;
					currImageData.data[idx+2] = res[2]%256;
					currImageData.data[idx+3] = 255;
				}
			}
			ctx.putImageData(currImageData, 0, 0);
			imageGenerator = generator.mutate();

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

	return ret;
}

/********************
 * helper functions */
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
function Handler(numIslands, popSize) {
	this.islands = [];
	this.popSize = popSize;
	for (var ai = 0; ai < numIslands; ai++) this.islands.push(new Island(popSize));

	this.step = function() {
		//////////////////////////
		//evolve all the islands//
		var currentBests = [];
		for (var ai = 0; ai < this.islands.length; ai++) {
			//evolve and get the current best solution and its score
			currentBests.push(this.islands[ai].evolve()); 
		}
		var currentBest = [Math.pow(2, 2000), ''];
		for (var ai = 0; ai < this.num_islands; ai++) {
			if (currentBests[ai][0] < currentBest[0]) {
				currentBest = currentBests[ai];
			}
		}

		/////////////
		//reporting//
		console.log('Generation #' + this.current_gen + '\n' + 
					'Score: ' + currentBest[0] + '\n' +
		/*			'Duration: ' + duration + 'ms, ' + 
						'Avg: ' + avgDuration + 'ms, ' + 
						'Total: ' + this.time_elapsed + 'ms\n' +
		*/			'Solution: ' + currentBest[1] + '\n'
		);
	};
}

function Island(popSize) {
	this.popSize = popSize;
	this.population = [new CGPBeing(2, 5, 4, 1)];

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
		return [selection.getFitness(), selection.squish()];
	};

	this.choose = function() {
		var scores = [this.population[0].getFitness()];
		var selection = this.population[0];
		for (var ai = 1; ai < this.population.length; ai++) {
			scores[ai] = this.population[ai].getFitness();
			if (scores[ai] >= scores[0]) { //the "or equals" in >= is very important!
				selection = this.population[ai];
			}
		}
		return selection;
	};
}

function CGPBeing(numInputs, cols, rows, numOutputs, genes) {
	this.numInputs = numInputs;
	this.cols = cols;
	this.rows = rows;
	this.numOutputs = numOutputs;
	this.genes = arguments.length === 5 ? genes : getRandBeing(
		this.numInputs, this.cols, this.rows, this.numOutputs
	);

	this.getFitness = function() {

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
		var mutRate = 0.10;
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

	this.copy = function() {
		var ret = new CGPBeing(
			this.numInputs, 
			this.cols, this.rows, 
			this.numOutputs, 
			this.genes.slice(0)
		);
		return ret;
	}

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

	function getRandBeing(numInputs, cols, rows, numOutputs) {
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