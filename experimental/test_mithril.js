'use strict';

export function TestInit(endpoint, routes) {
    routes[endpoint] = {
        onmatch: function(args, requestedPath, route) {
            let results = runTests(args.runonly);
            return {
                view: function() {
                    let renderer = new mithrilRenderer();
                    renderer.render(results);
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

// TODO(treaster): Remove all uses of this from outside this package, then unexport.
export class mithrilRenderer extends Renderer {
    constructor() {
        super();
    }

    renderBoilerplate() {
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
        return table;
    }

    renderOneTest(table, testName, statusText, message, hexColor) {
        table.append(mu('tr')
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
