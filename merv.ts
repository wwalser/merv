import { assert } from "console";

interface mervVariables {[variableName: string]: any}
interface mervFunctions {[functionName: string]: Function}

const booleanOperations = [
    '&&',
    '||',
    '==',
];

const isSpace = (ch: string) => {
    return ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n';
};

const isLetter = (ch: string) => {
    return (ch >= 'a' && ch <= 'z') 
        || (ch >= 'A' && ch <= 'Z')
        || ch == '_';
};

const isParen = (ch: string) => {
    return ch === '(' || ch === ')';
};

const isQuote = (ch: string) => {
    return ch === '"';
};

const isEscape = (ch: string) => {
    return ch === "\\";
};

const isEqual = (ch: string) => {
    return ch === "=";
};

const isNumber = (token: string) => {
    return !isNaN(parseFloat(token));
}

const tokenize = (thing: string): string[] => {
    if (!(thing && thing.length>0)) {
        return [];
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
                if (isEscape(ch) && (isQuote(thing.charAt(i+1)) || isEscape(thing.charAt(i+1)))) {
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

const isBoolean = (token: string) => {
    return token === 'true' || token === 'false';
};

const isBooleanOperation = (token: string) => {
    return booleanOperations.indexOf(token) !== -1;
};

const isString = (token: string) => {
    return isQuote(token.charAt(0));
}

const findClosingParen = (tokens: string[], startIndex: number): number => {
    let openCount = 0;
    for (let tokenCounter = startIndex; tokenCounter < tokens.length;) {
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
    throw new Error('Expected ")" before end of program.');
}

const execBoolean = (token: string) => () => {
    return token === 'true';
};

const execVariable = (token: string, variables: mervVariables) => () => {
    return variables[token];
};

const execFunction = (functionName: string, operands: Function[], functions: mervFunctions) => () => {
    return functions[functionName](...operands.map(op => op()));
}

const execBooleanOperation = (token: string, leftOperand: Function, rightOperand: Function) => () => {
    if (token === '&&') {
        return leftOperand() && rightOperand();
    } else if (token === '||') {
        return leftOperand() || rightOperand();
    } else if (token === '==') {
        return leftOperand() == rightOperand();
    }
};

const execString = (token: string) => () => {
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

const execNumber = (token: string) => () => {
    return parseFloat(token);
}

const value = (tokens: string[], variables: mervVariables, functions: mervFunctions, counterStart = 0): () => any => {
    const undefinedLeft:() => any = () => {};
    for (let tokenCounter = counterStart; tokenCounter < tokens.length;) {
        let currentToken = tokens[tokenCounter];
        let leftOperand = undefinedLeft;
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
            const operands: Function[] = [];
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
        if (leftOperand === undefinedLeft) {
            throw new Error(`Expected value or function but got "${currentToken}" at location ${tokenCounter}.`);
        }
        if (isBooleanOperation(currentToken)) {
            return execBooleanOperation(currentToken, leftOperand, value(tokens, variables, functions, tokenCounter+1));
        }
        return leftOperand;
    }
    throw new Error(`Unparsable expression.`);
}

const parse = (thing: string, variables = {}, functions = {}) => {
    const tokens = tokenize(thing);
    return value(
        tokens,
        variables,
        functions,
    );
}

export default parse;