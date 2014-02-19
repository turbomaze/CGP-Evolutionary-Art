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
var humanFitness = true;
var numGens = 10000;
var drawEvery = 50;
var numTrainingPoints = 50;

var seedBeing = new CGPBeing(4, 5, 4, 3);

var border = 8;
var numcellsy = 2;
var numcellsx = 3;

var canvasScale = 3;
var canvasWidth = 271;
var canvasHeight = 178;

/*************
 * constants */

/*********************
 * working variables */
var canvas;
var ctx;
var trainingData;
var handler;
var pop;
var humanBasedGenNum;

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
		pop = [seedBeing];
		for (var ai = 1; ai < numcellsy*numcellsx; ai++) pop.push(pop[0].mutate());
		humanBasedGenNum = 0;

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
	humanBasedGenNum += 1;
	$('#gen-count').innerHTML = 'Generation #'+humanBasedGenNum+''; 
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
			$('#msg').innerHTML = 'Drawing ' + which + '...';
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
		function() { //outer loop finished
			$('#msg').innerHTML = 'Finished drawing.'; 
		}
	);
}

function paintCGPBeing(gen, ys, ye, xs, xe) {
	function getRGBFromRaw(arr) {
		return arr.map(function(n){return Math.floor(tightMap(n,0,1,0,255));});
	}

	//determine the range of the outputting functions
	var funcRanges = []; //the number of outputs must be 3 so this will be 3 long
	//get the function ids of the final elements
	for (var ai = gen.dna.length-3; ai < gen.dna.length; ai++) {
		var inputBasedId = gen.dna[ai];
		var nodeId = inputBasedId - gen.numInputs;
		var idx = gen.GENE_LEN*nodeId;
		var gene = gen.dna.slice(idx, idx+gen.GENE_LEN);
		for (var gi = 0; gi < gen.GENE_LEN; gen++) {
			if (gen.GENE_PATN[gi] === 0) { //function gene
				funcRanges.push(cgpFuncRange(gene[gi]));
				break;
			}
		}
	}

	//draw all the pixels to the screen
	var currImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (var yi = ys; yi < ye; yi++) {
		for (var xi = xs; xi < xe; xi++) {
			var x = tightMap(xi-xs, 0, xe-xs, -0.5, 0.5);
			var y = tightMap(yi-ys, 0, ye-ys, -0.5, 0.5);
			var r = Math.sqrt(x*x + y*y);
			var theta = Math.atan2(y, x);
			var res = gen.evaluate([x, y, r, theta]);

			var idx = 4*(yi*canvas.width + xi);
			var raw = []; //the raw, normalized values of the outputs
			raw[0] = tightMap(res[0], funcRanges[0][0], funcRanges[0][1], 0, 1);
			raw[1] = tightMap(res[1], funcRanges[1][0], funcRanges[1][1], 0, 1);
			raw[2] = tightMap(res[2], funcRanges[2][0], funcRanges[2][1], 0, 1);
			var color = getRGBFromRaw(raw); //raw converted to an RGB value
			currImageData.data[idx+0] = color[0];
			currImageData.data[idx+1] = color[1];
			currImageData.data[idx+2] = color[2];
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

function getRandNum(lower, upper) { //returns number in [lower, upper)
	return Math.floor((Math.random()*(upper-lower))+lower);
}

function tightMap(n, d1, d2, r1, r2) { //enforces boundaries
	var raw = map(n, d1, d2, r1, r2);
	if (raw < r1) return r1;
	else if (raw > r2) return r2;
	else return raw;
}

//given an n in [d1, d2], return a linearly related number in [r1, r2]
function map(n, d1, d2, r1, r2) {
	var Rd = d2-d1;
	var Rr = r2-r1;
	return (Rr/Rd)*(n - d1) + r1;
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
	this.finished = false;

	this.step = function() {
		if (this.finished) return false;

		this.currentGen += 1;
		var start = currentTimeMillis();

		//////////////////////////
		//evolve all the islands//
		var currentBests = [];
		for (var ai = 0; ai < this.islands.length; ai++) {
			//evolve and get the current best solution and its score
			currentBests.push(this.islands[ai].evolve()); 
		}
		var currentBest = currentBests[0];
		for (var ai = 0; ai < this.islands.length; ai++) {
			if (currentBests[ai][1] <= currentBest[1]) {
				currentBest = currentBests[ai];
			}
		}

		/////////////
		//reporting//
		var duration = currentTimeMillis() - start;
		this.timeElapsed += duration;
		if (this.currentGen%this.logEvery === 0 || currentBest[1] === 0) {
			var avgDuration = this.timeElapsed/this.currentGen;
			console.log('Generation #' + this.currentGen + '\n' + 
						'Score: ' + currentBest[1] + '\n' +
						'Duration: ' + duration + 'ms, ' + 
							'Avg: ' + avgDuration + 'ms, ' + 
							'Total: ' + this.timeElapsed + 'ms\n' +
						'Solution: ' + currentBest[2] + '\n'
			);
		}
		if (currentBest[1] === 0) this.finished = true;

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
			scores[ai] = this.population[ai].getFitness(scores[0]);
			if (scores[ai] <= scores[0]) { //the "or equals" in <= is very important!
				selection = this.population[ai];
			}
		}
		return selection;
	};
}

function CGPBeing(numInputs, cols, rows, numOutputs, dna) {
	////////////////////
	//object constants//
	//0: function id, 1: connection id, 2: constant argument
	this.GENE_PATN = [0, 1, 1, 2]; //gene pattern
	this.GENE_LEN = this.GENE_PATN.length;
	this.MUT_RATE = 0.05;

	//////////
	//fields//
	this.numInputs = numInputs || 2;
	this.cols = cols || 4;
	this.rows = rows || 3;
	this.numOutputs = numOutputs || 3;
	this.dna = arguments.length === 5 ? dna : getRandGenes(
		this.GENE_PATN, 
		this.numInputs, this.cols, this.rows, this.numOutputs
	);

	//////////////////
	//work functions//
	this.getFitness = function(toBeat) {
		toBeat = toBeat || Math.pow(2, 1023);
		var score = 0;
		var colorsSeen = [];
		for (var ai = 0; ai < trainingData.length; ai++) {
			//don't waste time if it's already sub-parent
			if (score > toBeat) break; //don't bother
			var guess = this.evaluate(trainingData[ai][0]);
			score += correspSumSqDiff(guess, trainingData[ai][1]);
		}

		if (isNaN(score) || Math.abs(score) >= Infinity) {
			score = Math.pow(2, 1023);
		}
		return score;
	};

	this.evaluate = function(inputs) {
		//////////////////////////////////////
		//figure out which nodes to evaluate//
		var active = [];
		var numBPs = this.dna.length;
		for (var ai = numBPs-this.numOutputs; ai < numBPs; ai++) { //all the outputs
			//are active and so are all the nodes they reference (recurse)
			this.markReferenced(this.dna[ai], active);
		}
		active.sort(function(a,b) { return a-b; });

		///////////////////////////////////////////
		//evaluate the nodes you need to evaluate//
		var values = inputs.slice(0); //inputs are easy so load all of them
		var prev = -1; //so you don't double dip
		for (var ai = 0; ai < active.length; ai++) {
			if (active[ai] === prev) continue; //duplicates
			var idx = this.GENE_LEN*(active[ai]-this.numInputs); //input id->dna idx
			var funcId = -1;
			var inputs = [];
			var constArgs = [];
			for (var gi = 0; gi < this.GENE_LEN; gi++) {
				switch (this.GENE_PATN[gi]) {
					case 0: funcId = this.dna[idx+gi]; break; //func id
					case 1: //connection
						inputs.push(values[this.dna[idx+gi]]);
						break;
					case 2: //const arg
						constArgs.push(this.dna[idx+gi]); 
						break;
				}
			}
			values[active[ai]] = cgpFunc(funcId, inputs, constArgs);
			prev = active[ai];
		}

		/////////////////////////////
		//gather up all the outputs//
		var ret = []; //the outputs
		var numBPs = this.dna.length;
		for (var ai = numBPs-this.numOutputs; ai < numBPs; ai++) {
			ret.push(values[this.dna[ai]]); 
		}
		return ret;
	};

	this.mutate = function() {
		var mutatedBPs = this.dna.slice(0); //copy the original
		var numBPs = this.dna.length;
		var numToMutate = Math.max(this.MUT_RATE*numBPs, 1);

		for (var ai = 0; ai < numToMutate; ai++) {
			var idxToMutate = getRandNum(0, numBPs);
			var type = -1;
			if (idxToMutate >= numBPs-this.numOutputs) { //output gene
				type = 1; //same as connection genes
			} else {
				type = this.GENE_PATN[idxToMutate%this.GENE_LEN];
			}
			switch (type) {
				case 0: //function
					mutatedBPs[idxToMutate] = getRandFunctionId();
					break;
				case 1: //connections
					//the |0 removes the fractional part
					var col = (((idxToMutate/this.GENE_LEN)|0)/this.rows)|0;
					mutatedBPs[idxToMutate] = getRandGeneId(
						col, this.numInputs, this.rows
					);
					break;
				case 2: //constant arguments
					var scaleFactor = 0.9+0.2*Math.random(); //0.9 to 1.1
					if (Math.random() < 0.15) { //15% chance it's negative
						scaleFactor *= -1; //slim chance it flips sign
					}
					mutatedBPs[idxToMutate] = scaleFactor*this.dna[idxToMutate];
					break;
				default:
					mutatedBPs[idxToMutate] = this.dna[idxToMutate];
					break;
			}
		}
	
		return new CGPBeing(
			this.numInputs, this.cols, this.rows, this.numOutputs, mutatedBPs
		);
	};

	////////////////////
	//helper functions//
	this.markReferenced = function(geneId, arr) {
		if (geneId < this.numInputs) return; //don't mark anything for inputs
		
		arr.push(geneId); //mark it for evaluation
		var idx = this.GENE_LEN*(geneId - this.numInputs); //idx in the dna
		for (var gi = 0; gi < this.GENE_LEN; gi++) {
			switch (this.GENE_PATN[gi]) {
				case 1: //connection
					this.markReferenced(this.dna[idx+gi], arr);
					break;
			}
		}
	}

	this.squish = function() {
		//btoa([1,2,0.2145566]) = "MSwyLDAuMjE0NTU2Ng=="
		//atob("MSwyLDAuMjE0NTU2Ng==").split(",").map(parseFloat) = [1,2,0.2145566]
		var raw = btoa(this.dna);
		return raw.substring(0, 32)+':'+raw.substring(raw.length-32);
	};

	/////////////////////
	//private functions//
	function correspSumSqDiff(arr1, arr2) {
		var sum = 0;
		for (var ai = 0; ai < Math.min(arr1.length, arr2.length); ai++) {
			sum += Math.pow(2, (arr1.length-1)-ai)*Math.pow(arr1[ai] - arr2[ai], 2);
		}
		return sum;
	}

	function getRandFunctionId() {
		return getRandNum(0, NUM_FUNCS); 
	}

	function getRandGeneId(col, numInputs, rows) {
		return getRandNum(0, col*rows+numInputs);
	}

	function getRandConstArg() {
		return -1+2*Math.random();
	}

	function getRandGenes(pattern, numInputs, cols, rows, numOutputs) {
		var ret = [];
		for (var ai = 0; ai < cols; ai++) { //for each column
			for (var bi = 0; bi < rows; bi++) { //each row in that column
				for (var gi = 0; gi < pattern.length; gi++) {
					switch (pattern[gi]) {
						case 0: //func id
							ret.push(getRandFunctionId()); 
							break;
						case 1: //inputs
							ret.push(getRandGeneId(ai, numInputs, rows));
							break;
						case 2: //constant arguments
							ret.push(getRandConstArg());
							break;
					}
				}
			}
		}
		for (var ai = 0; ai < numOutputs; ai++) { //assign the output nodes
			ret.push(getRandGeneId(cols, numInputs, rows));
		}
		return ret;
	}
}

window.addEventListener('load', function() {
	initCGPEvoArt();
});