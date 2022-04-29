"use strict"

const OK = 'ok';
const FAILED = 'failed';
const SKIPPED = 'skipped';

// Run tests and render the results using the supplied renderer.
//
// Available options are:
// renderer: object
//     The renderer used to display the results. By default,
//     ConsoleRenderer will be used.
// runTestsParam: string
//     A URL param to toggle when tests should run.
//     By default, 'run_tests' is used. If the param is set to '1' in the URL,
//     tests will be executed and this function will return true. Otherwise,
//     this function will do nothing and it will return false.
//     For example: http://example.com?run_tests=1
// runOnlyParam: string
//     A URL param to control which specific test cases are run.
//     By default, 'run_only' is used. The param should be set to a regular
//     expression pattern. Any test name that has a partial match with the
//     pattern will be executed. All other tests will be skipped.
//     If this option is omitted, all tests will be executed.
//     For example: http://example.com?run_tests=1&run_only=TestMagical.*
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

// addTest() adds a test to the set of tests to run.
// All tests registered by addTest() will be executed when runTests() is called
// (excepting the behaviors of the runTestsParam and runOnlyParam options).
// testName: string, the name of the test case.
// testFunc: a function that takes one argument. The argument is a TestCase,
//     defined below. The function body performs the test behavior. Methods
//     on the TestCase are called to define the outcome of the test.
export function addTest(testName, testFunc) {
    testCases.push([testName, testFunc]);
}

// TestCase is passed to test functions to help verify test behavior.
// Test execution will stop when fail() is called or when any behavior
// assertion fails. (all assertions call fail() internally)
// The TestCase instance is provided to the test function by this testing
// framework.
class TestCase {
    // The constructor is not needed by applications.
    constructor(testName) {
        this.name = testName;
        this.status = 'skipped';
        this.exc = null;
    }

    // fail causes a test case to fail, with the specified error message.
    fail(msg) {
        throw new Error(msg);
    }

    // true causes the test to fail if actual not equal to true. Values that
    // implicitly convert to true, such as 1 or 'abc', are insufficient.
    // true is the same as equals(true, actual);
    true(actual) {
        if (actual !== true) {
            this.fail(`true !== ${actual}`);
        }
    }

    // false causes the test to fail if actual not equal to false. Values that
    // implicitly convert to false, such as 0 or '', are insufficient.
    // false is the same as equals(false, actual);
    false(actual) {
        if (actual !== false) {
            this.fail(`false !== ${actual}`);
        }
    }

    // equals causes the test to fail if actual is not equal to expected.
    // For object types, the objects must be exactly the same instance or reference.
    // Object keys are not traversed for equivalence.
    equals(expected, actual) {
        if (expected !== actual) {
            this.fail(`${expected} !== ${actual}`);
        }
    }

    // notEquals causes the test to fail if actual is equal to expected.
    notEquals(expected, actual) {
        if (expected === actual) {
            this.fail(`${expected} === ${actual}`);
        }
    }

    // objEquals causes the test to fail if actual is not recursively
    // equivalent to expected.
    // Equivalence is determined by converting both actual and expected to JSON,
    // then verifying that the JSON is identical.
    objEquals(expected, actual) {
        let expectedJson = JSON.stringify(expected);
        let actualJson = JSON.stringify(actual);
        if (expectedJson !== actualJson) {
            this.fail(`\n${expectedJson}\n  ===\n${actualJson}\n`);
        }
    }

    // objNotEquals causes the test to fail if actual is recursively
    // equivalent to expected.
    // Equivalence is determined by converting both actual and expected to JSON,
    // then verifying that the JSON is identical.
    objNotEquals(expected, actual) {
        let expectedJson = JSON.stringify(expected);
        let actualJson = JSON.stringify(actual);
        if (expectedJson === actualJson) {
            this.fail(`\n${expectedJson}\n  !==\n${actualJson}\n`);
        }
    }

    // defined fails if actual is undefined or null;
    defined(actual) {
        if (actual === undefined) {
            this.fail('unexpected undefined value. expected defined, not-null value.');
        }
        if (actual === null) {
            this.fail('unexpected null value. expected defined, not-null value.');
        }
    }

    // exception fails if failingFunc does not throw an exception when executed,
    // or if the exception message does not contain the errorFragment string.
    // This enables a test to verify when a function is expected to fail, and
    // that when it fails it fails in the expected way.
    exception(failingFunc, errorFragment) {
        try {
            failingFunc();
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


// Renderer is a base class for displaying unit test results.
// It does little on its own, but can be subclassed to provide custom rendering
// behaviors.
// Subclasses must define:
// renderBoilerplate(options):
//     options: the same object received by runTests().
// renderOneTest(options, table, testName, status, stack, hexColor):
//     options: the same object received by runTests()
//     table: the container the test result should be added to
//     testName: the name of the test that was executed
//     status: a string status for display. Probably 'OK', 'FAIL', or 'SKIPPED'.
//     stack: the call stack of a failed test
//     color: a color associated with the display. Different status codes
//         correspond to different colors.
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

// ConsoleRenderer displays test output to the browser's debug console.
// See Renderer for details of methods.
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

// ConsoleRenderer displays test elements by creating DOM elements in the web
// page itself.
// See Renderer for details of methods.
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
let testCases = [];

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
