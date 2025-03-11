import { DOMParser, Element, Node } from "npm:xmldom@0.6.0";

enum StringPosition {
  TEXT = "TEXT",
  ATTRIBUTE = "ATTRIBUTE",
  COMMENT = "COMMENT",
  NOT_FOUND = "NOT_FOUND",
  SCRIPT = "SCRIPT",
}

interface DetectionResult {
  position: StringPosition;
  node: Node;
  attributeName?: string;
}
/**
 * 检测字符串在 XML/XHTML DOM 中的位置（支持大小写敏感）
 * @param xhtmlString XHTML/XML 字符串
 * @param searchString 要搜索的字符串
 * @returns 包含位置类型和对应节点的结果数组
 */
function found(
  xhtmlString: string,
  searchString: string,
): DetectionResult[] {
  const parser = new DOMParser({ errorHandler: { warning: function () {} } });

  // 使用 application/xhtml+xml 模式解析
  const doc = parser.parseFromString(
    xhtmlString,
    "application/xhtml+xml",
  );

  if (!doc) {
    throw new Error("XML 解析失败");
  }

  const results: DetectionResult[] = [];

  // 递归遍历函数
  const walker = (node: Node) => {
    // 处理文本节点 (nodeType 3)
    if (node.nodeType === 3) { // TEXT_NODE
      const textContent = node.nodeValue || "";
      if (
        node.parentNode && node.parentNode?.nodeName.toLowerCase() === "script"
      ) {
        results.push({
          position: StringPosition.TEXT,
          node: node,
        });
      } else {
        if (textContent.includes(searchString)) {
          results.push({
            position: StringPosition.SCRIPT,
            node: node,
          });
        }
      }
    } // 处理注释节点 (nodeType 8)
    else if (node.nodeType === 8) { // COMMENT_NODE
      const commentContent = node.nodeValue || "";
      if (commentContent.includes(searchString)) {
        results.push({
          position: StringPosition.COMMENT,
          node: node,
        });
      }
    } // 处理元素节点 (nodeType 1)
    else if (node.nodeType === 1) { // ELEMENT_NODE
      const element = node as Element;

      // 检查所有属性
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.value.includes(searchString)) {
          results.push({
            position: StringPosition.ATTRIBUTE,
            node: element,
            attributeName: attr.name,
          });
        }
      }

      // 特殊处理 ID 属性
      const id = element.getAttribute("id");
      if (id?.includes(searchString)) {
        results.push({
          position: StringPosition.ATTRIBUTE,
          node: element,
          attributeName: "id",
        });
      }
    }

    // 递归遍历子节点
    for (let child = node.firstChild; child; child = child.nextSibling) {
      walker(child);
    }
  };

  walker(doc.documentElement);
  return results;
}

/**
 * 从字符串中匹配两个字符串之间的内容
 * @param srcBody 源字符串
 * @param start 开始字符串
 * @param end 结束字符串
 * @param n 最多匹配的字符数，-1 表示不限制
 * @returns 元组 [匹配内容的起始位置, 匹配到的内容]，如果没有匹配到则返回 [-1, ""]
 */
function matchBetween(
  srcBody: string,
  start: string,
  end: string,
  n: number,
): [number, string] {
  const startIndex = srcBody.indexOf(start);
  if (startIndex === -1) {
    return [-1, ""];
  }

  const contentStartIndex = startIndex + start.length;
  const searchEndIndex = n === -1 ? srcBody.length : contentStartIndex + n;
  const endIndex = srcBody.indexOf(end, contentStartIndex);

  if (endIndex === -1 || endIndex > searchEndIndex) {
    // 如果没有找到结束字符串，或者结束字符串在限制范围之外
    if (n === -1) {
      // 如果不限制长度，返回从开始到字符串末尾的所有内容
      return [startIndex, srcBody.slice(contentStartIndex)];
    } else {
      // 如果限制长度，返回指定长度的内容
      return [
        startIndex,
        srcBody.slice(contentStartIndex, contentStartIndex + n),
      ];
    }
  }

  // 返回匹配到的内容
  return [startIndex, srcBody.slice(contentStartIndex, endIndex)];
}
export type { DetectionResult };
export default {
  StringPosition,
  matchBetween,
  found,
};
