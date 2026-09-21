import {test} from 'node:test';
import assert from 'node:assert/strict';
import {totals,validate} from './ledger.js';
const make=transactions=>({version:1,categories:[{id:'fund',name:'Fund',target:100000}],transactions:transactions.map((t,i)=>({id:String(i),category:'fund',note:'',person:'',date:'2026-09-21',...t}))});
test('cash, expenses and loans remain separate',()=>{const s=make([{type:'income',amount:100000},{type:'expense',amount:20000},{type:'lend',amount:10000,person:'Ali'},{type:'receive',amount:4000,person:'ali'},{type:'borrow',amount:30000,person:'Sara'},{type:'repay',amount:5000,person:'Sara'}]);validate(s);assert.deepEqual([totals(s).cash,totals(s).spent,totals(s).receivable,totals(s).payable],[99000,20000,6000,25000]);});
test('opening loans do not move cash',()=>{const s=make([{type:'receivable',amount:12000,person:'Ali'},{type:'payable',amount:5000,person:'Sara'}]);assert.equal(totals(validate(s)).cash,0);});
test('reject overpayment and deleting a settled loan origin',()=>{assert.throws(()=>validate(make([{type:'receive',amount:100,person:'Ali'}])),/exceeds/);});
test('reject malformed backup amounts, unknown categories, duplicate IDs',()=>{for(const amount of [-1,0,0.1,NaN])assert.throws(()=>validate(make([{type:'income',amount}])));assert.throws(()=>validate(make([{type:'income',amount:100,category:'bad'}])));assert.throws(()=>validate(make([{type:'income',amount:100,id:'same'},{type:'income',amount:100,id:'same'}])));});
test('kameti contributions and collection tracked independently',()=>{const s=make([{type:'expense',amount:10000},{type:'income',amount:100000}]);assert.deepEqual(totals(s).funds.fund,{income:100000,spent:10000});assert.equal(totals(s).cash,90000);});

import {removeCategory} from './ledger.js';
test('move category transactions preserves balances',()=>{const s=make([{type:'income',amount:100}]);s.categories.push({id:'other',name:'Other',target:0});const next=removeCategory(s,'fund','other');assert.equal(totals(next).cash,100);assert.equal(next.transactions[0].category,'other');assert.equal(next.categories.length,1);});
test('delete last category and entries permits empty wallet',()=>{const next=removeCategory(make([{type:'income',amount:100}]),'fund');assert.equal(next.transactions.length,0);assert.equal(next.categories.length,0);});
test('category deletion cannot orphan a repayment',()=>{const s=make([{type:'lend',amount:100,person:'Ali'},{type:'receive',amount:50,person:'Ali',category:'other'}]);s.categories.push({id:'other',name:'Other',target:0});assert.throws(()=>removeCategory(s,'fund'),/exceeds/);});
