"use strict"

/**
 * A lightweight Javascript unit test framework with no dependencies.
 *
 * test.js is a lightweight unit test framework intended to be used for JS
 * applications that don't want to pull in the weight of nodejs, npm, etc.
 * This file has no other dependencies. It is intended to be used as a JS
 * module.
 *
 * To use:
 * 1. Copy this file near your other Javascript files.
 * 2. Use `import { addTest, runTests } from './test.js';` to an existing JS
 *    file.
 * 3. Define unit tests in or near the application code with addTest().
 * 4. Visit http://[your url]?run_tests=1 to execute the tests and see the
 *    results. Default behaviors are provided for easy setup, but they can be
 *    overridden.
 *
 * @author Mike Treaster
 */


/**
 * Run tests and render the results using the supplied renderer. runTests()
 * will examine the page URL to decide whether to run tests at all. This allows
 * the setup code in the application to be less intrusive, since runTests() can
 * be run blindly.
 *
 * @param {object} - options to configure the behavior of the test framework
 * @param {object} options.renderer -  The renderer used to display the results. By default, ConsoleRenderer will be used.
 * @param {string} options.runTestsParam - A URL param to toggle when tests should
 * run. By default, 'options.run_tests' is used. If the param is set to '1' in the URL,
 * tests will be executed and this function will return true. Otherwise,
 * this function will do nothing and it will return false.
 * For example: http: *example.com?run_tests=1
 * @param {string} options.runOnlyParam - A URL param to control which specific
 * test cases are run. By default, 'run_only' is used. The param should be set
 * to a regular expression pattern. Any test name that has a partial match with
 * the pattern will be executed. All other tests will be skipped.
 * If this option is omitted, all tests will be executed.
 * For example: http: *example.com?run_tests=1&run_only=TestMagical.*
 *
 * @returns {boolean} true if tests are executed, false if tests are skipped
 */
export function runTests(options) {
    if (!options) {
        options = {};
    }
    if (!options.renderer) {
        options.renderer = new ConsoleRenderer();
    }
    if (!options.runTestsParam) {
        options.runTestsParam = 'run_tests';
    }
    if (!options.runOnlyParam) {
        options.runOnlyParam = 'run_only';
    }

    let params = new URL(window.location).searchParams;
    if (params.get(options.runTestsParam) !== '1') {
        return false;
    }

    let results = runTestsInternal(params.get(options.runOnlyParam) || '');
    options.renderer.render(options, results);
    return true;
}

/**
 * @callback testFn - a function that executes a test behavior.
 * @param {TestCase} testCase - Methods on the TestCase should be called in
 * the function body to define the outcome of the test.
 */

/**
 * Adds a test to the set of tests to run.
 * All tests registered by addTest() will be executed when runTests() is called
 * (excepting the behaviors of the runTestsParam and runOnlyParam options).
 * 
 * @param {string} testName - string, the name of the test case.
 * @param {testFn} testFn - Defines a test behavior, and executes that behavior
 * when called.
 */
export function addTest(testName, testFn) {
    testCases.push([testName, testFn]);
}

/**
 * Passed to test functions to help verify test behavior.
 * Test execution will stop when fail() is called or when any behavior
 * assertion fails. (all assertions call fail() internally)
 * The TestCase instance is provided to the test function by this testing
 * framework.
 * @class
 */
class TestCase {
    /**
     * The constructor is not needed by applications.
     */
    constructor(testName) {
        this.name = testName;
        this.status = 'skipped';
        this.exc = null;
    }

    /**
     * Causes a test case to fail, with the specified error message.
     * @param {string} msg - the message to display in the test results
     */
    fail(msg) {
        throw new Error(msg);
    }

    /**
     * Causes the test to fail if actual not equal to true. Values that
     * implicitly convert to true, such as 1 or 'abc', are insufficient.
     * true is the same as equals(true, actual);
     * @param {*} actual - the value to compare to true
     */
    true(actual) {
        if (actual !== true) {
            this.fail(`true !== ${actual}`);
        }
    }

    /**
     * Causes the test to fail if actual not equal to false. Values that
     * implicitly convert to false, such as 0 or '', are insufficient.
     * false is the same as equals(false, actual);
     * @param {*} actual - the value to compare to false
     */
    false(actual) {
        if (actual !== false) {
            this.fail(`false !== ${actual}`);
        }
    }

    /**
     * Causes the test to fail if actual is not equal to expected.
     * For object types, the objects must be exactly the same instance or reference.
     * Object keys are not traversed for equivalence.
     * @param {*} expected - the expected value, defined by the test code
     * @param {*} actual - the actual value produced by running the tested code
     */
    equals(expected, actual) {
        if (expected !== actual) {
            this.fail(`${expected} !== ${actual}`);
        }
    }

    /**
     * Causes the test to fail if actual is equal to expected.
     * @param {*} expected - the expected value, defined by the test code
     * @param {*} actual - the actual value produced by running the tested code
     */
    notEquals(expected, actual) {
        if (expected === actual) {
            this.fail(`${expected} === ${actual}`);
        }
    }

    /**
     * Causes the test to fail if actual is not recursively
     * equivalent to expected.
     * Equivalence is determined by converting both actual and expected to JSON,
     * then verifying that the JSON is identical.
     * @param {*} expected - the expected value, defined by the test code
     * @param {*} actual - the actual value produced by running the tested code
     */
    objEquals(expected, actual) {
        let expectedJson = JSON.stringify(expected);
        let actualJson = JSON.stringify(actual);
        if (expectedJson !== actualJson) {
            this.fail(`\n${expectedJson}\n  ===\n${actualJson}\n`);
        }
    }

    /**
     * Causes the test to fail if actual is recursively
     * equivalent to expected.
     * Equivalence is determined by converting both actual and expected to JSON,
     * then verifying that the JSON is identical.
     * @param {*} expected - the expected value, defined by the test code
     * @param {*} actual - the actual value produced by running the tested code
     */
    objNotEquals(expected, actual) {
        let expectedJson = JSON.stringify(expected);
        let actualJson = JSON.stringify(actual);
        if (expectedJson === actualJson) {
            this.fail(`\n${expectedJson}\n  !==\n${actualJson}\n`);
        }
    }

    /**
     * Causes the test to fail if actual is undefined or null;
     * @param {*} actual - the actual value produced by running the tested code
     */
    defined(actual) {
        if (actual === undefined) {
            this.fail('unexpected undefined value. expected defined, not-null value.');
        }
        if (actual === null) {
            this.fail('unexpected null value. expected defined, not-null value.');
        }
    }

    /**
     * @callback exceptionFn - A function to test for that it will throw an exception.
     */

    /**
     * Causes the test to fail if failingFunc does not throw an exception when
     * executed, or if the exception message does not contain the errorFragment
     * string.
     * This enables a test to verify when a function is expected to fail, and
     * that when it fails it fails in the expected way.
     * @param {exceptionFn} failingFn - The function to test for failure. This
     * will be executed automatically by exception(), and passed no arguments.
     * @param {errorFragment} string - an expected fragment of the exception error
     * message.
     */
    exception(failingFn, errorFragment) {
        try {
            failingFn();
        } catch(exc) {
            if (exc.message.indexOf(errorFragment) === -1) {
                this.fail(`exception caught, but exception message did not contain expected fragment
                    expected: ${errorFragment}
                    received: ${exc.stack}`);
            }
            // this is the expected behavior
            return;
        }

        this.fail(`expected an exception with message '${errorFragment}', but no exception occurred`);
    }
};


const OK = 'ok';
const FAILED = 'failed';
const SKIPPED = 'skipped';

/**
 * A base class for displaying unit test results.
 * It does little on its own, but can be subclassed to provide custom rendering
 * behaviors.
 * Subclasses must define:
 * renderBoilerplate(options):
 *     options: the same object received by runTests().
 * renderOneTest(options, table, testName, status, stack, hexColor):
 *     options: the same object received by runTests()
 *     table: the container the test result should be added to
 *     testName: the name of the test that was executed
 *     status: a string status for display. Probably 'OK', 'FAIL', or 'SKIPPED'.
 *     stack: the call stack of a failed test
 *     color: a color associated with the display. Different status codes
 *         correspond to different colors.
 */
export class Renderer {
    constructor() {
    }

    render(options, results) {
        let table = this.renderBoilerplate(options);
        for (let result of results) {
            switch (result.status) {
                case OK:
                    this.ok(options, table, result.name);
                    break;
                case FAILED:
                    this.error(options, table, result.name, result.exc);
                    break;
                case SKIPPED:
                    this.skipped(options, table, result.name);
                    break;
            }
        }
    }

    ok(options, table, testName) {
        this.renderOneTest(options, table, testName, 'OK', '', '#00ff00');
    }

    error(options, table, testName, exc) {
        // Safari formats stacks differently from Chrome. This at least gets us
        // partway there.
        if (!exc.stack.startsWith('Error: ' + exc.message)) {
            exc.stack = `Error: ${exc.message}\n${exc.stack}`;
        }
        this.renderOneTest(options, table, testName, 'FAIL', exc.stack, '#ffaaaa');
    }

    skipped(options, table, testName) {
        this.renderOneTest(options, table, testName, 'SKIPPED', '', '');
    }

    // subclasses must provide renderBoilerplate() and renderOneTest()
}

/**
 * ConsoleRenderer displays test output to the browser's debug console.
 * See Renderer for details of methods.
 */
export class ConsoleRenderer extends Renderer {
    constructor() {
        super();
    }

    renderBoilerplate(options) {
        return null;
    }

    renderOneTest(options, table, testName, status, stack, hexColor) {
        let stackMsg = '';
        if (stack !== '') {
            stackMsg = `\n'${stack}`;
        }
        console.log(`Test "${testName}": ${status}${stackMsg}`);
    }
};

/**
 * ConsoleRenderer displays test elements by creating DOM elements in the web
 * page itself.
 * See Renderer for details of methods.
 */
export class DomRenderer extends Renderer {
    constructor(options) {
        super();

        if (!options) {
            options = {};
        }
        if (!options.containerElement) {
            options.containerElement = document.body;
        }
        if (!options.containerClassName) {
            options.containerClassName = '';
        }
        if (!options.containerStyle) {
            options.containerStyle = {
                fontSize: '12px',
                fontFamily: 'monospace',
            }
        }

        this._containerElement = options.containerElement;
        this._containerClassName = options.containerClassName;
        this._containerStyle = options.containerStyle;
    }

    renderBoilerplate(options) {
        if (this._containerClassName) {
            this._containerElement.className = this._containerClassName;
        }
        if (this._containerStyle) {
            this._containerElement.style = this._containerStyle;
        }

        let table = domElement(
            'table', 
            {
                style: {
                    fontFamily: 'monospace',
                    verticalAlign: 'top',
                    borderCollapse: 'collapse',
                    border: '1px solid black',
                },
            },
            null);

        let headerTr = domElement('tr', {}, null);

        let testName = domElement(
            'td', 
            { style: { width: '10em', textAlign: 'left', }, },
            'Test Name');
        headerTr.append(testName);

        let outcome = domElement(
            'td',
            { style: { width: '8em', textAlign: 'center', }, },
            'Outcome');
        headerTr.append(outcome);

        let message = domElement(
            'td',
            { style: { width: '20em', textAlign: 'left', }, },
            'Message');
        headerTr.append(message);

        table.append(headerTr);

        this._containerElement.append(table);

        return table;
    }

    renderOneTest(options, table, testName, statusText, message, hexColor) {
        let row = domElement(
            'tr',
            { style: { backgroundColor: hexColor }, },
            null);

        let nameElement = domElement(
            'td',
            { style: { textAlign: 'left', verticalAlign: 'top' }, },
            null);

        let clickElement = domElement(
            'a',
            {},
            testName);

        clickElement.onclick = (evt) => {
            let newQueryParams = [];
            let addedRunonly = false;
            let url = new URL(window.location);
            for (let pair of url.searchParams.entries()) {
                let key = pair[0];
                let value = pair[1];
                if (key === options.runOnlyParam) {
                    value = testName;
                    addedRunonly = true;
                }
                newQueryParams.push(`${key}=${value}`);
            };

            if (!addedRunonly) {
                newQueryParams.push(`${options.runOnlyParam}=${testName}`);
            }

            let newQuery = `?${newQueryParams.join('&')}`
            window.location.search = newQuery;
        };
        nameElement.append(clickElement);
        row.append(nameElement);

        let statusElement = domElement(
            'td',
            { style: { textAlign: 'center', verticalAlign: 'top' }, },
            statusText);
        row.append(statusElement);

        let messageElement = domElement(
            'td',
            { style: { textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre' }, },
            message);
        row.append(messageElement);

        table.append(row);
    }
}




// testCases is a global object to store tests added by the application.
// When runTests() is called, all tests in this array are executed.
// Applications use addTest() to add tests to the set.
// This is an implementation detail, and users should not attempt to
// modify this.
const testCases = [];

function runTestsInternal(testPattern) {
    let r = new RegExp(testPattern);
    let results = [];

    for (let testCase of testCases) {
        let testName = testCase[0];

        let testFunc = testCase[1];
        let t = new TestCase(testName);
        if (!r.test(testName)) {
            t.status = SKIPPED;
        } else {
            try {
                testFunc(t);
                t.status = OK;
            } catch(exc) {
                t.status = FAILED;
                t.exc = exc;
            }
        }

        results.push(t);
    }

    return results;
};

function domElement(tag, attrs, innerText) {
    let element = document.createElement(tag);
    Object.keys(attrs).forEach(key => {
        const val = attrs[key];
        if (isObject(val)) {
            element[key] = {}
            Object.keys(val).forEach(subkey => {
                element[key][subkey] = val[subkey];
            });
        } else {
            element[key] = attrs[key];
        }
    });

    if (innerText !== null) {
        element.innerText = innerText;
    }
    return element;
}

function isObject(v) {
    return (
        typeof v === 'object' &&
        !Array.isArray(v) &&
        v !== null);
}
