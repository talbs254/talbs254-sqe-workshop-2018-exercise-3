import assert from 'assert';
import {cfg_modification} from '../src/js/code-analyzer';
import * as esgraph from 'esgraph/lib';
import * as esprima from 'esprima';

it('simple function', () => {
    let code = function foo(x,y,z){
        return x + y -z;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="return x + y - z;"]\n');
});
it('if statement', () => {
    let code = function foo(x,y,z){
        if(x + y < z)
            z = x + y;
        return z;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="x + y < z"]\nn1 [label="z = x + y"]\nn2 [label="return z;"]\nn3 [label=" "]\nn0 -> n3 [' +
        ']\nn0 -> n1 [label="true"]\nn0 -> n2 [label="false"]\nn1 -> n3 []\nn3 -> n2 []\n');
});
it('while statement', () => {
    let code = function foo(x,y,z){
        while(x + y < z)
            x = x +y;
        return x;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="x + y < z"]\nn1 [label="x = x + y"]\nn2 [label="return x;"]\nn3 ' +
        '[label="NULL"]\nn0 -> n1 [label="true"]\nn0 -> n2 [label="false"]\nn1 -> n3 []\nn3 -> n0 []\n' );
});

it('array assignment', () => {
    let code = function foo(x,y,z){
        let a = [1,2,3];
        a[2] = x + y +z - a[3];
        return a;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="let a = [    1,    2,    3];"]\nn1 [label="a[2] = x + y + z - a[3]"]\nn2 [label="return a;"]\nn0 -> n1 []\nn1 -> n2 []\n' );
});

it('nested if statement', () => {
    let code = function foo(x,y,z){
        if(x < y){
            if(x > z){
                return true;
            }
        }
        return false;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="x < y"]\nn1 [label="x > z"]\nn2 [label="return true;"]\nn3 [label="return false;"]\nn4 ' +
        '[label=" "]\nn0 -> n4 []\nn0 -> n1 [label="true"]\nn0 -> n3 [label="false"]\nn1 -> n4 []\nn1 -> n2 [label="true"]\nn1 -> n3 ' +
        '[label="false"]\nn4 -> n3 []\n');
});


it('if in while statement', () => {
    let code = function foo(x,y,z){
        while(x < y + z){
            if( x == 4){
                return false;
            }
            x = x * 2;
        }
        return true;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="x < y + z"]\nn1 [label="x == 4"]\nn2 [label="return false;"]\nn3 ' +
        '[label="x = x * 2"]\nn4 [label="return true;"]\nn5 [label="NULL"]\nn0 -> n1 [label="true"]\n' +
        'n0 -> n4 [label="false"]\nn1 -> n2 [label="true"]\nn1 -> n3 [label="false"]\nn3 -> n5 []\nn5 -> n0 []\n');
});

it('while in if statement', () => {
    let code = function foo(x,y,z){
        if( x < y + z){
            while( x < 5){
                y = y + 6;
                x++;
            }
        }
        return y;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="x < y + z"]\nn1 [label="x < 5"]\nn2 [label="y = y + 6"]\nn3 [label="x++"]\nn4 [label="return y;"]\nn5 ' +
        '[label="NULL"]\nn6 [label=" "]\nn0 -> n6 []\nn0 -> n1 [label="true"]\nn0 -> n4 [label="false"]\nn1 -> n6 []\nn1 -> n2' +
        ' [label="true"]\nn1 -> n4 [label="false"]\nn2 -> n3 []\nn3 -> n5 []\nn5 -> n1 []\nn6 -> n4 []\n');
});

it('nested while statement', () => {
    let code = function foo(x,y,z){
        while(x < y + z){
            x = x * 2;
            while(x < 5){
                x++;
            }
        }
        return x;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="x < y + z"]\nn1 [label="x = x * 2"]\nn2 [label="x < 5"]\nn3 [label="x++"]\nn4 ' +
        '[label="return x;"]\nn5 [label="NULL"]\nn6 [label="NULL"]\nn0 -> n1 [label="true"]\nn0 -> n4' +
        ' [label="false"]\nn1 -> n6 []\nn2 -> n5 []\nn2 -> n3 [label="true"]\nn2 -> n0 [label="false"]\nn3 -> n6 []\nn5 -> n0 []\nn6 -> n2 []\n');
});

it('no args function', () => {
    let code = function foo() {
        let a = 5;
        let b = 6;
        return a + b;
    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, 'n0 [label="let a = 5;"]\nn1 [label="let b = 6;"]\nn2 [label="return a + b;"]\nn0 -> n1 []\nn1 -> n2 []\n');
});

it('empty function', () => {
    let code = function foo() {

    } + '';
    let dot = code_to_dot(code);
    assert.equal(dot, '');
});



let code_to_dot = (code)=>{
    let parsed_code = esprima.parseScript(code);
    let cfg = esgraph(parsed_code.body[0].body);
    cfg[2] = cfg_modification(cfg[2]);
    return esgraph.dot(cfg, {counter: 0, source: parsed_code.body[0].body});
};