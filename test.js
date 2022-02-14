"use strict"

const OK = 'ok';
const FAILED = 'failed';
const SKIPPED = 'skipped';

export function render(renderer, results) {
    for (let result of results) {
        switch (result.status) {
            case OK:
                renderer.ok(result.name);
                break;
            case FAILED:
                renderer.error(result.name, result.exc);
                break;
            case SKIPPED:
                renderer.skipped(result.name);
                break;
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

    skipped(testName) {
        console.log(`Test "${testName}": SKIPPED`);
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
        this._row(testName, 'OK', '', '#00ff00');
    }

    error(testName, exc) {
        this._row(testName, 'FAIL', exc.stack, '#ffaaaa');
    }

    skipped(testName) {
        this._row(testName, 'SKIPPED', '', '');
    }

    _row(testName, statusText, message, hexColor) {
        this.table.append(mu('tr')
            .style('backgroundColor', hexColor)
            .append(mu('td')
                .style('textAlign', 'left')
                .style('verticalAlign', 'top')
                .click(evt => {
                    m.route.set('/test', {runonly: testName}, {});
                })
                .setText(testName))
            .append(mu('td')
                .style('textAlign', 'center')
                .style('verticalAlign', 'top')
                .setText(statusText))
            .append(mu('td')
                .style('textAlign', 'left')
                .style('verticalAlign', 'top')
                .style('whiteSpace', 'pre')
                .setText(message)));
    }
}

export function TestInit(endpoint, routes) {
    routes[endpoint] = {
        onmatch: function(args, requestedPath, route) {
            let results = runTests(args.runonly);
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

export function runTests(testPattern) {
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
