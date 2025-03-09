function randomUpperAndLower(str: string): string {
  return str.split('').map((char) => {
    if (char.match(/[a-zA-Z]/)) {
      return Math.random() < 0.5 ? char.toLowerCase() : char.toUpperCase();
    }
    return char;
  }).join('');
}

function generateRandomString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
function IsDigit(val: string) {
  return /^\d+$/.test(val);
}

function toUnicodeEscape(str: string) {
  return str.split('').map((char) => {
    return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
  }).join('');
}

function stringsWithParam(template: string, params: any) {
  // 替换模板中的参数
  let result = template.replace(/\{\{params\((.*?)\)\}\}/g, (match, key) => {
    return params[key] || match;
  });

  // 处理随机字符串
  result = result.replace(/\{\{randstr\((\d+)\)\}\}/g, (match, length) => {
    return generateRandomString(parseInt(length));
  });

  // 返回结果数组
  return result;
}
function isJson(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

export {
  /**
   * 生成指定长度的随机大小写字母字符串
   * @param length 要生成的字符串长度
   * @returns 随机生成的大小写字母字符串
   */
  generateRandomString,
  IsDigit,
  isJson,
  randomUpperAndLower,
  stringsWithParam,
  toUnicodeEscape,
};
