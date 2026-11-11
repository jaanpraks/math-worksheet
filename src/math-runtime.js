import {create,all} from 'mathjs';

const math=create(all);
let remainingTerms=5000;
function bounded(product){
  const operation=(args,_math,scope)=>{
    if(args.length!==4 || !args[1].isSymbolNode)throw Error('Use sumOver(expression,index,lower,upper) or productOver(expression,index,lower,upper).');
    const lower=args[2].compile().evaluate(scope),upper=args[3].compile().evaluate(scope);
    if(!Number.isSafeInteger(lower) || !Number.isSafeInteger(upper))throw Error('Sum and product bounds must be finite integers.');
    if(upper-lower+1>5000)throw Error('Sums and products support at most 5000 terms.');
    args[0].traverse(node=>{if(node.isAssignmentNode || node.isFunctionAssignmentNode)throw Error('Assignments are not allowed inside a sum or product.');});
    const local=new Map();for(const key of scope.keys())local.set(key,scope.get(key));
    const body=args[0].compile();let result;
    for(let index=lower;index<=upper;index++){if(--remainingTerms<0)throw Error('Sums and products support at most 5000 total terms per evaluation.');local.set(args[1].name,index);const value=body.evaluate(local);result=result===undefined?value:product?math.multiply(result,value):math.add(result,value);}
    return result===undefined?(product?1:0):result;
  };
  operation.rawArgs=true;return operation;
}
math.import({sumOver:bounded(false),productOver:bounded(true)});
export function evaluate(source,scope=new Map()){remainingTerms=5000;return math.evaluate(source,scope);}
