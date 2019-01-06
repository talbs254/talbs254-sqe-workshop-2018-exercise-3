import * as escodegen from 'escodegen';



function cfg_modification(cfg){
    cfg = remove_exceptions_edges(cfg);
    cfg = remove_entry_node(cfg);
    cfg = remove_exit_node(cfg);
    cfg = merge_nodes_handler(cfg);
    return cfg;
}

let remove_exceptions_edges =  (cfg) =>{
    for(let i = 0; i < cfg.length; i += 1)
        delete cfg[i]['exception'];
    return cfg;
};

let remove_entry_node = (cfg) => {
    cfg.splice(0,1);
    return cfg;
};

function merge_nodes_handler(cfg){
    let cfg_len = cfg.length;
    for(let i = 0 ; i < cfg_len; i += 1){
        let node = cfg[i];
        if(node.prev.length > 1) { // merging node;
            let merge_node = add_merge_node(cfg, i);
            cfg.push(merge_node);
        }
        else{
            node.shape = 'rectangle';
        }
        node.type = escodegen.generate(node.astNode)
            .split('\n').join(''); // for arrays cases
    }
    return cfg;
}
//TODO prev.true \ prev.false case
function remove_exit_node(cfg){
    let exit_node = cfg[cfg.length-1];
    for(let i = 0 ; i < exit_node.prev.length; i += 1){
        let prev = exit_node.prev[i];
        if(prev.normal === exit_node)
            delete prev['normal'];
        for(let j = 0; j < prev.next.length; j += 1){
            let next = prev.next[i];
            if(next === exit_node){
                prev.next.splice(i,1);
            }
        }
    }
    cfg.splice(cfg.length-1,1);
    return cfg;
}

//TODO prev.true \ prev.false case
function add_merge_node(cfg, i){
    let merge_next = cfg[i];
    let type = merge_next.parent.type === 'WhileStatement' ? 'NULL' : ' ';
    let shape = merge_next.parent.type === 'WhileStatement' ? 'rectangle' : 'circle';
    let merge_node = {next: [merge_next], prev: merge_next.prev, normal: merge_next, type: type, shape: shape};
    merge_next.prev = merge_node;
    for(let i = 0; i < merge_node.prev.length; i += 1){
        let prev = merge_node.prev[i];
        prev.normal = merge_node;
        prev.next = [merge_node];
    }
    return merge_node;

}


export {cfg_modification};