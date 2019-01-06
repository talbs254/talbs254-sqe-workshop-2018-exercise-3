import $ from 'jquery';
import * as esprima from 'esprima';

let input_vector = [];
let local_vars = [];

let statement_handler = {
    'VariableDeclaration': variable_handler,
    'BinaryExpression': binary_handler,
    'Identifier' : identifier_handler,
    'IfStatement': if_handler,
    'ExpressionStatement': expression_handler,
    'Literal' : literal_handler,
    'ReturnStatement': return_handler,
    'AssignmentExpression': assignment_handler,
    'WhileStatement': while_handler,
    'UpdateExpression': update_handler,
    'ArrayExpression': array_handler,
    'MemberExpression': member_handler,
    // 'BlockStatement': block_handler,
};


function compute_path(cfg){
    let codeToParse = $('#codePlaceholder').val();
    let parsed_code = esprima.parseScript(codeToParse);
    init_input_vector(parsed_code);
    iterate_cfg_graph(cfg);
    local_vars;
    input_vector;
    return cfg;
}

function init_input_vector(parsed_code){
    // assumes the length of the input is legit
    let input_vector_arr = document.getElementById('inputVector').value.replace(/\s/g,'').split(',');
    let function_statement = parsed_code.body[0];
    let idx = 0;
    function_statement.params.forEach((param) => {
        input_vector.push({
            key: param.name,
            value: input_vector_arr[idx]
        });
        idx += 1;
    });
}


function iterate_cfg_graph(cfg){
    let curr_node = cfg[0];
    while(curr_node){
        curr_node.color = 'green';
        if(is_parent_if_statement(curr_node))
            curr_node = if_statement_next(curr_node);
        else if(is_parent_while_statement(curr_node))
            curr_node = while_statement_next(curr_node);
        else if(curr_node.astNode)
            curr_node = reg_node_next(curr_node);
        else{ // merge points and NULL
            curr_node = curr_node.normal;
        }
    }
    return cfg;
}

let is_parent_if_statement = (curr_node) =>{
    return curr_node.parent && curr_node.parent.type === 'IfStatement';
};

let is_parent_while_statement = (curr_node) =>{
    return curr_node.parent && curr_node.parent.type === 'WhileStatement';
};

function if_statement_next(curr_node){
    let test_result;
    curr_node.shape = 'diamond';
    test_result = statement_handler[curr_node.parent.type](curr_node.parent);
    return  test_result == true ? curr_node.true : curr_node.false;
}
function while_statement_next(curr_node){
    let test_result;
    curr_node.shape = 'diamond';
    test_result = statement_handler[curr_node.parent.type](curr_node.parent);
    return  test_result == true ? curr_node.true : curr_node.false;
}
function reg_node_next(curr_node){
    curr_node.shape = 'rectangle';
    statement_handler[curr_node.astNode.type](curr_node.astNode);
    return  curr_node.normal;
}

function variable_handler(parsed_code){
    parsed_code.declarations.forEach(function (variable) {
        local_vars.push({
            key: variable.id.name,
            value: statement_handler[variable.init.type](variable.init)
        });
    });
}
function expression_handler(parsed_code){
    statement_handler[parsed_code.expression.type](parsed_code.expression);
}

function literal_handler(parsed_code){
    return parsed_code.value;
}

function binary_handler(parsed_code){
    let left = statement_handler[parsed_code.left.type](parsed_code.left);
    let right = statement_handler[parsed_code.right.type](parsed_code.right);
    let operator = parsed_code.operator.replace('<', ' < ').replace('>',' > ');
    return '(' + left + operator + right + ')';
}
function identifier_handler(parsed_code, var_id = false) {
    let id = parsed_code.name;
    let variable = get_var(id);
    return var_id == true ? variable.key : variable.value;
}

function if_handler(parsed_code){
    return test_cond_result(parsed_code);
}

function while_handler(parsed_code){
    return test_cond_result(parsed_code);
}
function update_handler(parsed_code){
    let id = parsed_code.argument.name;
    let variable = get_var(id);
    let ret_val = parsed_code.operator === '++' ? eval(variable.value.toString().concat('+','1'))
        : eval(variable.value.toString().concat('-','1'));
    variable.value = ret_val;
    return ret_val;

}

let test_cond_result = (parsed_code) =>{
    let test_left = statement_handler[parsed_code.test.left.type](parsed_code.test.left);
    let test_right = statement_handler[parsed_code.test.right.type](parsed_code.test.right);
    let operator = parsed_code.test.operator.replace('<', ' < ').replace('>',' > ');
    return eval(test_left + operator + test_right);
};

function assignment_handler(parsed_code){
    let id = statement_handler[parsed_code.left.type](parsed_code.left, true);
    let value = statement_handler[parsed_code.right.type](parsed_code.right);
    id.length == 0 ? get_var(id).value = value : set_arr_var(id, value);
}

function return_handler(){
    // do not implement this function!
}

function array_handler(parsed_code){
    let arr = [];
    parsed_code.elements.forEach(function (elem) {
        arr.push(statement_handler[elem.type](elem));
    });
    return arr;
}
function member_handler(parsed_code, var_id = false){
    let arr_id = parsed_code.object.name;
    let ele_idx = statement_handler[parsed_code.property.type](parsed_code.property);
    if(var_id)
        return [arr_id, ele_idx];
    else{
        let arr_obj = input_vector.filter(x=>x.key==arr_id)[0];
        arr_obj = !arr_obj ? local_vars.filter(x=>x.key==arr_id)[0] : arr_obj;
        return arr_obj.value[ele_idx];
    }
}


let get_var = (id) => {
    let variable = local_vars.filter(x => x.key == id)[0];
    if(!variable) variable = input_vector.filter(x => x.key == id)[0];
    return variable;

};

let set_arr_var = (id, value) =>{
    let arr_name = id[0];
    let elem_idx = id[1];
    let arr = input_vector.filter(x=>x.key==arr_name)[0];
    if(!arr) arr = local_vars.filter(x=>x.key==arr_name)[0];
    arr.value[elem_idx] = value;
};
export {compute_path};