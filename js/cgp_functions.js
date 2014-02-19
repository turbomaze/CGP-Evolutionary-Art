
var NUM_FUNCS = 14;
var cgpFunc = function(idx, varArgs, constArgs) {
	switch (idx) {
		case 0: return varArgs[0]; //first param function
		case 1: return varArgs[1]; //second param function
		case 2: return varArgs[0]+varArgs[1]; //addition
		case 3: return varArgs[0]-varArgs[1]; //subtraction
		case 4: return varArgs[0]*varArgs[1]; //multiplication
		case 5:  //safe division (/0 -> 0)
			return varArgs[1] === 0 ? 
				0 : varArgs[0]/varArgs[1];
		case 6: //safe exponentiation
			var ret = 1;
			if (varArgs[0] < 0) Math.pow(varArgs[0], Math.round(varArgs[1]));
			return ret;
		case 7: return Math.sin(varArgs[0]); //sin
		case 8: return Math.cos(varArgs[0]); //cos
		case 9: return Math.tan(varArgs[0]); //tan
		case 10: return Math.sqrt(Math.max(varArgs[0], 0)); //safe sqrt (< 0 -> 0)
		case 11: return Math.round(varArgs[0]); //round first param
		case 12: return Math.round(varArgs[1]); //round second param
		case 13: return constArgs[0]; //return the constant
	}
	return 0;
};

var cgpFuncRange = function(idx) {
	var m = 10E3; //generic boundary magnitude
	switch (idx) {
		case 0: //first param function
		case 1: //second param function
			return [-m, m];
		case 2: return [-2*m, 2*m]; //addition
		case 3: return [-2*m, 2*m]; //subtraction
		case 4: return [-m*m, m*m]; //multiplication
		case 5: return [-m*m, m*m]; //safe division (/0 -> 0)
		case 6: return [0, Math.pow(m, 6)]; //exponentiation
		case 7: return [-1, 1]; //sin
		case 8: return [-1, 1]; //cos
		case 9: return [-m, m]; //tan
		case 10: return [0, Math.sqrt(m)]; //sqrt
		case 11: return [-m, m]; //round first param
		case 12: return [-m, m]; //round second param
		case 13: return [-10, 10]; //return the constant
	}
	return 0;
};