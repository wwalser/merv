import {strict as assert} from 'assert';
import merv from './merv';

const programs: {[program: string]: any} = {
    // boolean tests
    'true': true,
    'false': false,
    // string tests
    '"testing"': "testing",
    '"Escapes \\"work\\" inside strings"': 'Escapes "work" inside strings',
    '"Escaping \\\\ slashes."': 'Escaping \\ slashes.',
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
    // LT
    '10 < 11': true,
    '10 < 9': false,
    '10 <= 9': false,
    '10 <= 10': true,
    '10 <= 11': true,
    // GT
    '10 > 11': false,
    '10 > 9': true,
    '10 >= 9': true,
    '10 >= 10': true,
    '10 >= 11': false,
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
    'fnOr(false, false)': false,
    'fnOr(true && true, false || true)': true,
};

const variables = {
  varThatIsTrue: true,
  varThatIsFalse: false,
  myArray: ["hello", "world"],
};
const functions = {
  functionRetTrue: () => true,
  functionRetOp: <T>(op: T) => op,
  twoOpOr: <T, X>(a: T, b: X) => a || b,
  arrayContains: <T>(arr: Array<T>, needle: T) => arr.indexOf(needle) !== -1,
  fnOr: (...args: boolean[]) => args.reduce((acc, arg) => acc || arg, false)
};

describe('merv', function() {
  Object.keys(programs).forEach((program) => {
    describe(`Run program: ${program}`, function() {
      it('Should elicit the correct result', function() {
        const result = merv({variables, functions}).parse(program)();
        assert.equal(result, programs[program]);
      });
    });
  });
});