"use strict"

const OK = 'ok';
const FAILED = 'failed';
const SKIPPED = 'skipped';

// Run tests and render the results using the supplied renderer.
// If ?run_tests is not defined in the URL and/or is not equal '1', do nothing.
// If ?runonly=[regexp] is defined, run only tests matching the specified pattern.
// TODO(treaster): wrap this in an object, parameterize the URL query names,
// and remove global vars from this file.
export function runTests(renderer) {
    let params = new URL(window.location).searchParams;
    if (params.get('run_tests') !== '1') {
        return false;
    }

    let results = runTestsInternal(params.get('runonly') || '');
    renderer.render(results);
    return true;
}

export class Renderer {
    constructor() {
    }

    render(results) {
        let table = this.renderBoilerplate();
        for (let result of results) {
            switch (result.status) {
                case OK:
                    this.ok(table, result.name);
                    break;
                case FAILED:
                    this.error(table, result.name, result.exc);
                    break;
                case SKIPPED:
                    this.skipped(table, result.name);
                    break;
            }
        }
    }

    ok(table, testName) {
        this.renderOneTest(table, testName, 'OK', '', '#00ff00');
    }

    error(table, testName, exc) {
        this.renderOneTest(table, testName, 'FAIL', exc.stack, '#ffaaaa');
    }

    skipped(table, testName) {
        this.renderOneTest(table, testName, 'SKIPPED', '', '');
    }

    // subclasses must provide renderBoilerplate() and renderOneTest()
}

export class ConsoleRenderer extends Renderer {
    constructor() {
        super();
    }

    renderBoilerplate() {
        return null;
    }

    renderOneTest(table, testName, status, stack, hexColor) {
        let stackMsg = '';
        if (stack !== '') {
            stackMsg = `\n'${stack}`;
        }
        console.log(`Test "${testName}": ${status}${stackMsg}`);
    }
};

export class DomRenderer extends Renderer {
    constructor(parentElement) {
        super();
        this._parentElement = parentElement;
    }

    renderBoilerplate() {
        let table = domElement(
            'table', 
            {
                fontFamily: 'monospace',
                verticalAlign: 'top',
                borderCollapse: 'collapse',
                border: '1px solid black',
            },
            null);

        let headerTr = domElement('tr', {}, null);

        let testName = domElement(
            'td', 
            { width: '10em', textAlign: 'left', },
            'Test Name');
        headerTr.append(testName);

        let outcome = domElement(
            'td',
            { width: '8em', textAlign: 'center', },
            'Outcome');
        headerTr.append(outcome);

        let message = domElement(
            'td',
            { width: '20em', textAlign: 'left', },
            'Message');
        headerTr.append(message);

        table.append(headerTr);

        this._parentElement.append(table);

        return table;
    }

    renderOneTest(table, testName, statusText, message, hexColor) {
        let row = domElement(
            'tr',
            { backgroundColor: hexColor },
            null);

        let nameElement = domElement(
            'td',
            { textAlign: 'left', verticalAlign: 'top' },
            testName);
        nameElement.onclick = (evt) => {
            let newQueryParams = [];
            let addedRunonly = false;
            let url = new URL(window.location);
            for (let pair of url.searchParams.entries()) {
                let key = pair[0];
                let value = pair[1];
                if (key === 'runonly') {
                    value = testName;
                    addedRunonly = true;
                }
                newQueryParams.push(`${key}=${value}`);
            };

            if (!addedRunonly) {
                newQueryParams.push(`runonly=${testName}`);
            }

            let newQuery = `?${newQueryParams.join('&')}`
            window.location.search = newQuery;
        };
        row.append(nameElement);

        let statusElement = domElement(
            'td',
            { textAlign: 'center', verticalAlign: 'top' },
            statusText);
        row.append(statusElement);

        let messageElement = domElement(
            'td',
            { textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre' },
            message);
        row.append(messageElement);

        table.append(row);
    }
}


class T {
    constructor(testName) {
        this.name = testName;
        this.status = 'skipped';
        this.exc = null;
    }

    fail(msg) {
        throw new Error(msg);
    }
};

let testCases = [];

export function addTest(testName, testFunc) {
    testCases.push([testName, testFunc]);
}

function runTestsInternal(testPattern) {
    let r = new RegExp(testPattern);
    let results = [];

    for (let testCase of testCases) {
        let testName = testCase[0];

        let testFunc = testCase[1];
        let t = new T(testName);
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

export let require = {
    true: function(t, actual, msg) {
        if (actual !== true) {
            t.fail(`true !== ${actual}`);
        }
    },

    false: function(t, actual, msg) {
        if (actual !== false) {
            t.fail(`false !== ${actual}`);
        }
    },

    equals: function(t, expected, actual) {
        if (expected !== actual) {
            t.fail(`${expected} !== ${actual}`);
        }
    },

    notEquals: function(t, expected, actual) {
        if (expected === actual) {
            t.fail(`${expected} === ${actual}`);
        }
    },

    objEquals: function(t, expected, actual) {
        let expectedJson = JSON.stringify(expected);
        let actualJson = JSON.stringify(actual);
        if (expectedJson !== actualJson) {
            t.fail(`${expectedJson} === ${actualJson}`);
        }
    },

    defined: function(t, actual) {
        if (actual === undefined) {
            t.fail('unexpected undefined value. expected defined, not-null value.');
        }
        if (actual === null) {
            t.fail('unexpected null value. expected defined, not-null value.');
        }
    },

    exception: function(t, failingFunc, errorFragment) {
        try {
            failingFunc();
        } catch(exc) {
            if (exc.message.indexOf(errorFragment) === -1) {
                t.fail(`exception caught, but exception message did not contain expected fragment
                    expected: ${errorFragment}
                    received: ${exc.stack}`);
            }
            // this is the expected behavior
            return;
        }

        t.fail(`expected an exception with message '${errorFragment}', but no exception occurred`);
    }
};

function domElement(tag, style, innerText) {
    let element = document.createElement(tag);
    element.style = style;
    Object.keys(style).forEach(attr => {
        element.style[attr] = style[attr];
    });
    if (innerText !== null) {
        element.innerText = innerText;
    }
    return element;
}
