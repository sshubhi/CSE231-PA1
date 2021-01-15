import { Stmt, Expr } from "./ast";
import { parse } from "./parser";

// https://learnxinyminutes.com/docs/wasm/

type LocalEnv = Map<string, boolean>;

type CompileResult = {
  wasmSource: string,
};

export function compile(source: string) : CompileResult {
  const ast = parse(source);
  const definedVars = new Set();
  ast.forEach(s => {
    switch(s.tag) {
      case "define":
        definedVars.add(s.name);
        break;
    }
  }); 
  const scratchVar : string = `(local $$last i32)`;
  const localDefines = [scratchVar];
  definedVars.forEach(v => {
    localDefines.push(`(local $${v} i32)`);
  })
  
  const commandGroups = ast.map((stmt) => codeGen(stmt));
  const commands = localDefines.concat([].concat.apply([], commandGroups));
  console.log("Generated: ", commands.join("\n"));
  return {
    wasmSource: commands.join("\n"),
  };
}

function codeGen(stmt: Stmt) : Array<string> {
  switch(stmt.tag) {
    case "define":
      var valStmts = codeGenExpr(stmt.value);
      return valStmts.concat([`(local.set $${stmt.name})`]);
    case "expr":
      var exprStmts = codeGenExpr(stmt.expr);
      return exprStmts.concat([`(local.set $$last)`]);
  }
}

function codeGenExpr(expr : Expr) : Array<string> {
  switch(expr.tag) {
    case "builtin1":
      const argStmts = codeGenExpr(expr.arg);
      return argStmts.concat([`(call $${expr.name})`]);
    case "builtin2":
      let built2Stmts = codeGenExpr(expr.arg1);
      built2Stmts = built2Stmts.concat(codeGenExpr(expr.arg2));
      return built2Stmts.concat([`(call $${expr.name})`]);
    case "num":
      return ["(i32.const " + expr.value + ")"];
    case "id":
      return [`(local.get $${expr.name})`];
    case "binary":
      let biStmts = codeGenExpr(expr.arg1);
      biStmts = biStmts.concat(codeGenExpr(expr.arg2));
      //console.log("\n printing now :   \n");
      //console.log( biStmts);
      //console.log("\n done printing!!");
      switch(expr.op) {
        case "+" : biStmts = biStmts.concat([`(i32.add)`]);
                  break;
        case "-" : biStmts = biStmts.concat([`(i32.sub)`]);
                  break;
        case "*" : biStmts = biStmts.concat([`(i32.mul)`]);
                  break;
      }
      //console.log("Printing SUMIRAN's debug messages:\n");
      //console.log(biStmts);
      return biStmts;
  }
}
