"use strict"

export function render(renderer, results) {
    for (let result of results) {
        if (result.isOk) {
            renderer.ok(result.name);
        } else {
            renderer.error(result.name, result.exc);
        }
    }
}


export function ConsoleRenderer() {
    return new consoleRenderer();
};

// TODO(treaster): Remove all uses of this from outside this package, then unexport.
export class consoleRenderer {
    constructor() {
    }

    ok(testName) {
        console.log(`Test "${testName}": OK`);
    }

    error(testName, exc) {
        console.error(`Test "${testName}": FAILED\n${exc.stack}`);
    }
};

// TODO(treaster): Remove all uses of this from outside this package, then unexport.
export class mithrilRenderer {
    constructor() {
        let table = mu('table')
            .style('fontFamily', 'monospace')
            .style('verticalAlign', 'top')
            .style('borderCollapse', 'collapse')
            .style('border', '1px solid black')
            .append(mu('tr')
                .append(mu('th')
                    .style('width', '10em')
                    .style('textAlign', 'left')
                    .setText('Test Name'))
                .append(mu('th')
                    .style('width', '8em')
                    .style('text-align', 'center')
                    .setText('Outcome'))
                .append(mu('th')
                    .style('width', '20em')
                    .style('textAlign', 'left')
                    .setText('Message')));
        this.table = table;
    }

    ok(testName) {
        this.table.append(mu('tr')
            .style('backgroundColor', '#00ff00')
            .append(mu('td')
                .style('textAlign', 'left')
                .style('verticalAlign', 'top')
                .setText(testName))
            .append(mu('td')
                .style('textAlign', 'center')
                .style('verticalAlign', 'top')
                .setText('OK'))
            .append(mu('td')
                .style('textAlign', 'left')
                .style('verticalAlign', 'top')
                .style('whiteSpace', 'pre')
                .setText('')));
    }

    error(testName, exc) {
        this.table.append(mu('tr')
            .style('backgroundColor', '#ffaaaa')
            .append(mu('td')
                .style('textAlign', 'left')
                .style('verticalAlign', 'top')
                .setText(testName))
            .append(mu('td')
                .style('textAlign', 'center')
                .style('verticalAlign', 'top')
                .setText('FAIL'))
            .append(mu('td')
                .style('textAlign', 'left')
                .style('verticalAlign', 'top')
                .style('whiteSpace', 'pre')
                .setText(exc.stack)));
    }
}

export function TestInit(endpoint, routes) {
    routes[endpoint] = {
        onmatch: function() {
            let results = runTests();
            return {
                view: function() {
                    let renderer = new mithrilRenderer();
                    render(renderer, results);
                    return [
                        renderer.table,
                    ];
                },
            }
        },
        render: function(vnode) {
            return [vnode];
        },
    };
}

class T {
    constructor(testName) {
        this.name = testName;
        this.isOk = true;
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

export function runTests(renderer) {
    let results = [];

    for (let testCase of testCases) {
        let testName = testCase[0];
        let testFunc = testCase[1];
        let t = new T(testName);
        try {
            testFunc(t);
            t.isOk = true;
        } catch(exc) {
            t.isOk = false;
            t.exc = exc;
        }

        results.push(t);
    }

    return results;
};

export let require = {
    true: function(t, value, msg) {
        if (value === false) {
            t.fail('true !== false');
        }
    },

    false: function(t, value, msg) {
        if (value === true) {
            t.fail('false !== true');
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
