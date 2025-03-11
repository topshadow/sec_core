/**
 * 采用acron 编译js代码 并提供例如查找字符串向量
 * @module
 */
import * as acorn from "npm:acorn@8.7.1";



export interface ASTNode {
  type: string;
  value?: any;
  [key: string]: any;
}

 export interface ASTWalkResult {
  error: Error | null;
  stringLiterals: string[];
}

 export function astWalk(jsCode: string): ASTWalkResult {
  let ast: acorn.Node;

  // 解析 JavaScript 代码
  try {
    ast = acorn.parse(jsCode, { ecmaVersion: 2020 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        error: new Error(`Syntax error in the input code: ${error.message}`),
        stringLiterals: [],
      };
    } else {
      return {
        error: new Error(`An error occurred while parsing: ${error}`),
        stringLiterals: [],
      };
    }
  }

  // 遍历 AST 并提取字符串常量
  function extractStringLiterals(node: ASTNode, result: Set<string> = new Set()): Set<string> {
    if (node.type === "Literal" && typeof node.value === "string") {
      result.add(node.value);
    } else if (node.type === "TemplateLiteral") {
      node.quasis.forEach((quasi: ASTNode) => {
        if (quasi.type === "TemplateElement" && typeof quasi.value.cooked === "string") {
          result.add(quasi.value.cooked);
        }
      });
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(item => extractStringLiterals(item as ASTNode, result));
        } else if (typeof value === "object" && value !== null) {
          extractStringLiterals(value as ASTNode, result);
        }
      });
    }
    return result;
  }

  try {
    const stringLiterals = Array.from(extractStringLiterals(ast as ASTNode));
    return {
      error: null,
      stringLiterals,
    };
  } catch (error) {
    return {
      error: new Error(`An error occurred while extracting string literals: ${error}`),
      stringLiterals: [],
    };
  }
}


Deno.test('js parse',()=>{

    const code = `dasda=>
    const greeting = "Hello";
    const name = 'World';
    console.log(\`\${greeting}, \${name}!\`);
    `;
    
    
    const stringLiterals = astWalk(code);
    
    console.log("String literals:", stringLiterals);
    
})