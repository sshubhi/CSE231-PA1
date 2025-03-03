import {parser} from "lezer-python";
import {TreeCursor} from "lezer-tree";
import {Expr, Stmt} from "./ast";

export function traverseExpr(c : TreeCursor, s : string) : Expr {
  switch(c.type.name) {
    case "Number":
      return {
        tag: "num",
        value: Number(s.substring(c.from, c.to))
      }
    case "VariableName":
      return {
        tag: "id",
        name: s.substring(c.from, c.to)
      }
    case "CallExpression":
      c.firstChild();
      const callName = s.substring(c.from, c.to);
      c.nextSibling(); // go to arglist
      c.firstChild(); // go into arglist
      c.nextSibling(); // find single argument in arglist
      const arg_b1 = traverseExpr(c, s);
      c.nextSibling();
      if (s.substring(c.from,c.to) == ",") {
        c.nextSibling();  // Second Argument
        const arg_b2 = traverseExpr(c, s);
        c.parent();
        c.parent();
        return {
          tag: "builtin2",
          name: callName,
          arg1: arg_b1,
          arg2: arg_b2
        }
      }
      else {
        c.parent(); // pop arglist
        c.parent(); // pop CallExpression
        return {
          tag: "builtin1",
          name: callName,
          arg: arg_b1
        }
      }
    case "BinaryExpression":
      c.firstChild();
      const arg1 = traverseExpr(c,s);
      c.nextSibling();
      const op = s.substring(c.from,c.to);
      c.nextSibling();
      const arg2 = traverseExpr(c,s);
      c.parent();
      return {
        tag: "binary",
        arg1: arg1,
        op: op,
        arg2: arg2,
      }

    default:
      throw new Error("Could not parse expr at " + c.from + " " + c.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverseStmt(c : TreeCursor, s : string) : Stmt {
  switch(c.node.type.name) {
    case "AssignStatement":
      c.firstChild(); // go to name
      const name = s.substring(c.from, c.to);
      c.nextSibling(); // go to equals
      c.nextSibling(); // go to value
      const value = traverseExpr(c, s);
      c.parent();
      return {
        tag: "define",
        name: name,
        value: value
      }
    case "ExpressionStatement":
      c.firstChild();
      const expr = traverseExpr(c, s);
      c.parent(); // pop going into stmt
      return { tag: "expr", expr: expr }
    default:
      throw new Error("Could not parse stmt at " + c.node.from + " " + c.node.to + ": " + s.substring(c.from, c.to));
  }
}

export function traverse(c : TreeCursor, s : string) : Array<Stmt> {
  switch(c.node.type.name) {
    case "Script":
      const stmts = [];
      c.firstChild();
      do {
        stmts.push(traverseStmt(c, s));
      } while(c.nextSibling())
      console.log("traversed " + stmts.length + " statements ", stmts, "stopped at " , c.node);
      return stmts;
    default:
      throw new Error("Could not parse program at " + c.node.from + " " + c.node.to);
  }
}
export function parse(source : string) : Array<Stmt> {
  const t = parser.parse(source);
  return traverse(t.cursor(), source);
}
