const programs = {
    // boolean tests
    'true': true,
    'false': false,
    // string tests
    '"testing"': "testing",
    // number tests
    '1234': 1234,
    // && tests
    'true && true': true,
    'true && false': false,
    'false && true': false,
    // || tests
    'true || true': true,
    'true || false': true,
    'false || false': false,
    // equality
    'true == false': false,
    'false == false': true,
    '"testing" == "foobar"': false,
    '"baz" == "baz"': true,
    '1234 == 1234': true,
    // variable tests
    'varThatIsTrue': true,
    'varThatIsFalse': false,
    'varThatIsTrue || false': true,
    'varThatIsFalse && true': false,
    // function tests
    'functionRetTrue()': true,
    'false || functionRetTrue()': true,
    'functionRetOp(true)': true,
    'functionRetOp(true && false)': false,
    'twoOpOr(false, true)': true,
    'twoOpOr(false, functionRetTrue())': true,
    'functionRetOp(1234) == functionRetOp(1234)': true,
    // Complexity
    'functionRetOp(false) || true' : true,
    'true && twoOpOr(false, functionRetOp(false) || true)': true,
    // Use cases
    'arrayContains(myArray, "world")': true,
};

const booleanOperations = [
    '&&',
    '||',
    '==',
];

const isSpace = (ch) => {
    return ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n';
};

const isLetter = (ch) => {
    return (ch >= 'a' && ch <= 'z') 
        || (ch >= 'A' && ch <= 'Z')
        || ch == '_';
};

const isParen = (ch) => {
    return ch === '(' || ch === ')';
};

const isQuote = (ch) => {
    return ch === '"';
};

const isEscape = (ch) => {
    return ch === "\\";
};

const isEqual = (ch) => {
    return ch === "=";
};

const isNumber = (token) => {
    return !isNaN(token) && !isNaN(parseFloat(token));
}

const tokenize = (thing) => {
    if (!(thing && thing.length>0)) {
        return false;
    }
    
    const tokens = [];
    let i = 0;
    while (i < thing.length) {
        let ch = thing.charAt(i);
        let currentToken = '';

        // ignore spaces
        if (isSpace(ch)) {
            i++;
            continue;
        }

        // chop up token kinds
        if (isLetter(ch)){
            while (isLetter(ch) && i < thing.length) {
                currentToken += ch;
                i++;
                ch = thing.charAt(i);
            }
        } else if (isParen(ch)) {
            currentToken += ch;
            i++;
        } else if (isEqual(ch)) {
            if (!isEqual(thing.charAt(i+1))) {
                throw new Error(`Expected "=" at character ${i+1}`);
            }
            currentToken += "==";
            i += 2;
            ch = thing.charAt(i);
        } else if (isNumber(ch)) {
            do {
                currentToken += ch;
                i++;
                ch = thing.charAt(i);
            } while (isNumber(ch))
        } else if (isQuote(ch)) {
            do {
                if (isEscape(ch) && (isQuote(thing.charAt(i+1) || isEscape(i+1)))) {
                    i++;
                    ch = thing.charAt(i);
                }
                currentToken += ch;
                i++;
                ch = thing.charAt(i);
            } while (!isQuote(ch))
            // Add closing quote to the token
            currentToken += ch;
            i++;
            ch = thing.charAt(i);
        } else {
            while (!isSpace(ch) && !isLetter(ch) && i < thing.length) {
                currentToken += ch;
                i++;
                ch = thing.charAt(i);
            }
        }
        tokens.push(currentToken);
    }

    return tokens;
};

const isBoolean = (token) => {
    return token === 'true' || token === 'false';
};

const isBooleanOperation = (token) => {
    return booleanOperations.indexOf(token) !== -1;
};

const isString = (token) => {
    return isQuote(token.charAt(0));
}

const findClosingParen = (tokens, startIndex) => {
    let openCount = 0;
    for (tokenCounter = startIndex; tokenCounter < tokens.length;) {
        const currentToken = tokens[tokenCounter];
        if (currentToken === ')' && openCount === 0) {
            return tokenCounter;
        } else if (currentToken === ')') {
            openCount--;
        } else if (currentToken === '(') {
            openCount++;
        }
        tokenCounter++;
    }
}

const execBoolean = (token) => () => {
    return token === 'true';
};

const execVariable = (token, variables) => () => {
    return variables[token];
};

const execFunction = (functionName, operands, functions) => () => {
    return functions[functionName](...operands.map(op => op()));
}

const execBooleanOperation = (token, leftOperand, rightOperand) => () => {
    if (token === '&&') {
        return leftOperand() && rightOperand();
    } else if (token === '||') {
        return leftOperand() || rightOperand();
    } else if (token === '==') {
        return leftOperand() == rightOperand();
    }
};

const execString = (token) => () => {
    let stringResult = "";
    for (let i = 1; i < token.length-1; i++) {
        let ch = token.charAt(i);
        if (isEscape(ch)) {
            i++;
            ch = token.charAt(i);
        }
        stringResult += ch;
    }
    return stringResult;
}

const execNumber = (token) => () => {
    return parseFloat(token);
}

const value = (tokens, variables, functions, counterStart = 0) => {
    for (let tokenCounter = counterStart; tokenCounter < tokens.length;) {
        let currentToken = tokens[tokenCounter];
        let leftOperand = undefined;
        if (isBoolean(currentToken)) {
            leftOperand = execBoolean(currentToken);
            tokenCounter++;
            currentToken = tokens[tokenCounter];
        } else if (isString(currentToken)) {
            leftOperand = execString(currentToken);
            tokenCounter++;
            currentToken = tokens[tokenCounter];
        } else if (isNumber(currentToken)) {
            leftOperand = execNumber(currentToken);
            tokenCounter++;
            currentToken = tokens[tokenCounter];
        } else if (variables.hasOwnProperty(currentToken)) {
            leftOperand = execVariable(currentToken, variables);
            tokenCounter++;
            currentToken = tokens[tokenCounter];
        } else if (functions.hasOwnProperty(currentToken)) {
            const functionName = currentToken;
            tokenCounter++;
            currentToken = tokens[tokenCounter];
            if (currentToken !== '(') {
                throw new Error(`Expected "(" at character ${tokenCounter}`);
            }
            tokenCounter++;
            currentToken = tokens[tokenCounter];
            const operands = [];
            while (currentToken !== ')' && tokenCounter < tokens.length) {
                let endOfOperand = tokens.indexOf(',', tokenCounter);
                if (endOfOperand !== -1) {
                    operands.push(value(tokens.slice(tokenCounter, endOfOperand), variables, functions));
                    // intentionally incrementing past the ","
                    tokenCounter = endOfOperand+1;
                } else {
                    endOfOperand = findClosingParen(tokens, tokenCounter);
                    operands.push(value(tokens.slice(tokenCounter, endOfOperand), variables, functions));
                    // not incrementing past the ")"" so that our loop knows to jump out of function operands
                    tokenCounter = endOfOperand;
                }
                currentToken = tokens[tokenCounter];
            }
            if (currentToken !== ')') {
                throw new Error('Expected ")" before end of program.');
            }
            leftOperand = execFunction(functionName, operands, functions);
            tokenCounter++;
            currentToken = tokens[tokenCounter];
        }
        if (isBooleanOperation(currentToken)) {
            return execBooleanOperation(currentToken, leftOperand, value(tokens, variables, functions, tokenCounter+1));
        } else {
            if (leftOperand) {
                return leftOperand;
            }
            throw new Error(`error parsing token "${currentToken}" at location ${tokenCounter}.`);
        }
    }
}

const parse = (thing, variables = {}, functions = {}) => {
    const tokens = tokenize(thing);
    return value(
        tokens,
        variables,
        functions,
    );
}


// Test runner.
const variables = {
    varThatIsTrue: true,
    varThatIsFalse: false,
    myArray: ["hello", "world"],
};
const functions = {
    functionRetTrue: () => true,
    functionRetOp: op => op,
    twoOpOr: (a, b) => a || b,
    arrayContains: (arr, needle) => arr.indexOf(needle) !== -1,
};
Object.keys(programs).forEach((program) => {
    const result = parse(program, variables, functions)();
    const passed = result === programs[program];
    console.log(passed ? '✔' : '✖')
    if (!passed) {
        console.log(`program: '${program}' evaluates to: ${result} but should evaluate to ${programs[program]}`,);
    }
});