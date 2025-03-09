import { assertEquals } from 'https://deno.land/std@0.202.0/assert/assert_equals.ts';
import { randomUpperAndLower, stringsWithParam } from './str.ts'
// --- 测试用例 ---
Deno.test("空字符串返回空", () => {
    assertEquals(randomUpperAndLower(""), "");
  });
  
  Deno.test("非字母字符保持不变", () => {
    const input = "123!@# 你好  ";
    const result = randomUpperAndLower(input);
    assertEquals(result, input); // 非字母字符不应被修改
  });
  
  Deno.test("字母字符大小写随机化验证", () => {
    const input = "abcXYZ";
    
    // 多次运行测试至少出现不同结果
    let variations = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const result = randomUpperAndLower(input);
      variations.add(result);
      
      // 验证字符类型变化
      const changed = Array.from(result).some((c, i) => 
        c.toLowerCase() === input[i].toLowerCase() && c !== input[i]
      );
      assertEquals(changed, true); // 至少有一个字符大小写变化
    }
  
    // 结果应有多种可能性（允许极小概率失败）
    assertEquals(variations.size > 1, true);
  });
  
  Deno.test("混合内容测试", () => {
    const input = "Hello 123 World!";
    const result = randomUpperAndLower(input);
    
    // 验证长度和定位非字母字符
    assertEquals(result.length, input.length);
    assertEquals(result[5], " ");    // 空格保持
    assertEquals(result[6], "1");    // 数字保持
    assertEquals(result[13], "!");   // 符号保持
  });
  
  Deno.test("全大写字母可能变小写", () => {
    const input = "ABCDEF";
    const result = randomUpperAndLower(input);
    
    // 统计至少有一个字母变成小写的概率
    const hasLower = /[a-z]/.test(result);
    assertEquals(hasLower, true); 
  });
Deno.test("str random with param", () => {
    // 使用示例
const template = `{"{{randstr(2)}}":{"@type":"java.net.InetSocketAddress","val":"{{params(reverseConnTarget)}}"}}`;
const params = {
  reverseConnTarget: "\\u0065\\u0078\\u0061\\u006d\\u0070\\u006c\\u0065\\u002e\\u0063\\u006f\\u006d"
};

const result = stringsWithParam(template, params);
console.log(result[0]);
})
