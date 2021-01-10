# merv
merv is a simple logical expression evaluator. It aims to be a very simple but useful DSL for cases where full JS access is insecure.

The original use case is a user-facing interface that allows expressions for boolean evaluation. We wanted something more powerful than could be easily built using form fields but were opposed to exposing the full JS engine (using `eval()`) for security reasons.

merv is implemented using a very basic recurive descent parser and is therefore easy to read and extend.

## Using merv
NPM or Yarn install followed by:

### Basic logic expressions
```
import merv from 'merv';
const mervExpression = 'true && false';
const mervResult = merv().parse(mervExpression)();
// mervResult === false

const mervExpression2 = 'true || false';
const mervResult2 = merv().parse(mervExpression2)();
// mervResult2 === true
```

### Variables
Variables can be injected from the outside environment.
```
const mervExpression = 'myVar == "hello world"';
const mervInstance = merv({variables: {myVar: 'hello world'}})
const result = mervInstance.parse(mervExpression)();
// result === true
```

### Functions
Same with functions
```
const mervExpression = 'fnOr(false, false)';
const fnOr = (...args) => args.reduce((acc, arg) => acc || arg, false)
const mervInstance = merv({functions: {fnOr}})
const result = mervInstance.parse(mervExpression)();
// result === false
```

## What is supported
merv supports the following logical operators:
```
// '||' —— Logical or
// '&&' —— Logical and
// '==' —— Logical equality
```

The following values:
```
// 'true' 'false' — Booleans
// '"string"' —— String literals. Double quotes only. Escape sequence, \, for double quotes '\"' or backslash '\\'
// '1234' —— Numbers
// 'fnName()' —— Functions
// 'varName' —— Variables
```

## The license of merv
merv is not a "project". It is a very simple piece of code that serves a targeted use case. If you need to use merv, you likely don't have the exact use-case that merv was design for. For this reason, the unlicense license is used to avoid entanglements. Just copy and paste the code into your code base and customise it to do what you need. No credit or attribution is necessary. The license need not remain.
Public domain and all that jazz. 