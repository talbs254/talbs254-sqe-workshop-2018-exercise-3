import $ from 'jquery';
import {cfg_modification} from './code-analyzer';
import {compute_path} from './graph_path';

import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render';
import * as esprima from 'esprima';
import * as esgraph from 'esgraph/lib';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsed_code = esprima.parseScript(codeToParse);
        let cfg = esgraph(parsed_code.body[0].body);
        cfg[2] = cfg_modification(cfg[2]);
        cfg[2] = compute_path(cfg[2]);
        let dot = esgraph.dot(cfg, {counter: 0, source: parsed_code.body[0].body});
        dot = modified_dot(dot, cfg[2]);
        plot_cfg_graph(dot);

    });
});


function modified_dot(dot, cfg){
    dot = dot.split('\n');
    for(let i = 0; i < cfg.length; i += 1){
        let node = cfg[i];
        let color = node.color === 'green'  ? 'limegreen' : 'whitegrey';
        dot[i] = 'n' + i + ' [label="(' + i + ')\n' + node.type
            + '", fillcolor="' + color + '", shape="' + node.shape + '", style="filled"]';
    }
    return dot.join('\n');
}

function plot_cfg_graph(dot){
    let graph = document.getElementById('cfg');
    var viz = new Viz({ Module, render });
    viz.renderSVGElement('digraph G {' + dot + '}')
        .then(function(element) {
            graph.innerHTML = '';
            graph.append(element);
        });
}