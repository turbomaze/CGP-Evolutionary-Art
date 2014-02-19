
var NUM_FUNCS = 18;
var cgpFunc = function(idx, varArgs, constArgs) {
	switch (idx) {
		case 0: return constArgs[0]; //return the constant
		case 1: return varArgs[0]; //first param function
		case 2: return varArgs[1]; //second param function
		case 3: return Math.round(varArgs[0]); //round first param
		case 4: return Math.round(varArgs[1]); //round second param
		case 5: return varArgs[0]+varArgs[1]; //addition
		case 6: return varArgs[0]-varArgs[1]; //subtraction
		case 7: return varArgs[0]*varArgs[1]; //multiplication
		case 8: return varArgs[1] === 0 ? 0 : varArgs[0]/varArgs[1]; //safe division
		case 9: return Math.sqrt(Math.abs(varArgs[0])); //sqrt(abs(v))
		case 10: return varArgs[0]*varArgs[0]; //square
		case 11: return Math.pow(varArgs[0], 3); //cube
		case 12: return varArgs[0] === 0 ? 0 : 1/varArgs[0]; //safe invert
		case 13: return varArgs[0] === 0 ? 0 : Math.log(varArgs[0]); //safe ln(v)
		case 14: return Math.sin(varArgs[0]); //sin
		case 15: return Math.cos(varArgs[0]); //cos
		case 16: return Math.tan(varArgs[0]); //tan
		case 17: return Math.atan2(varArgs[0], varArgs[1]); //atan2
	}
	return 0;
};

var cgpFuncRange = function(idx) {
	//display plane is in [-v, v] for both x and y
	var v = 0.5; //0 < v < 1
	switch (idx) {
		case 0: return [-5, 5]; //return the constant
		case 1: //first param function
		case 2: //second param function
			return [-v, v];
		case 3: //round first param
		case 4: //round second param
			return [-1, 1];
		case 5: //addition
		case 6: //subtraction
			return [-2*v, 2*v];
		case 7: return [-v*v, v*v]; //multiplication
		case 8: return [-1E3, 1E3]; //safe division (/0 -> 0)
		case 9: return [0, Math.sqrt(v)]; //sqrt(abs(v))
		case 10: return [0, Math.pow(v, 2)]; //square
		case 11: return [-Math.pow(v, 3), Math.pow(v, 3)]; //cube
		case 12: return [-1E3, 1E3]; //invert
		case 13: return [Math.log(1E-3), Math.log(v)]; //safe ln(v)
		case 14: //sin
		case 15: //cos
			return [-1, 1];
		case 16: return [-Math.tan(v), Math.tan(v)]; //tan
		case 17: return [-Math.PI, Math.PI]; //atan2
	}
	return 0;
};