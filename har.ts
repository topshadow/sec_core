/**
 * HAR 格式相关类型定义
 */

// HAR 头部
export interface HarHeader {
  name: string;
  value: string;
  comment?: string;
}

// HAR 查询参数
export interface HarQueryString {
  name: string;
  value: string;
  comment?: string;
}

// HAR Cookie
export interface HarCookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  comment?: string;
}

// HAR 请求体
export interface HarPostData {
  mimeType: string;
  text?: string;
  params?: Array<{
    name: string;
    value?: string;
    fileName?: string;
    contentType?: string;
    comment?: string;
  }>;
  comment?: string;
}

// HAR 请求
export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  queryString: HarQueryString[];
  postData?: HarPostData;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

// HAR 响应内容
export interface HarContent {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
}

// HAR 响应
export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: HarCookie[];
  headers: HarHeader[];
  content: HarContent;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

// HAR 缓存
export interface HarCache {
  beforeRequest?: {
    expires?: string;
    lastAccess: string;
    eTag: string;
    hitCount: number;
    comment?: string;
  };
  afterRequest?: {
    expires?: string;
    lastAccess: string;
    eTag: string;
    hitCount: number;
    comment?: string;
  };
  comment?: string;
}

// HAR 计时
export interface HarTiming {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
}

// HAR 条目
export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: HarCache;
  timings: HarTiming;
  serverIPAddress?: string;
  connection?: string;
  comment?: string;
}

// HAR 页面
export interface HarPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTimings: {
    onContentLoad?: number;
    onLoad?: number;
    comment?: string;
  };
  comment?: string;
}

// HAR 创建者
export interface HarCreator {
  name: string;
  version: string;
  comment?: string;
}

// HAR 浏览器
export interface HarBrowser {
  name: string;
  version: string;
  comment?: string;
}

// 完整的 HAR 格式
export interface Har {
  log: {
    version: string;
    creator: HarCreator;
    browser?: HarBrowser;
    pages?: HarPage[];
    entries: HarEntry[];
    comment?: string;
  };
}

/**
 * 将 HAR 文件内容解析为 JavaScript 对象
 * @param harContent HAR 文件内容（字符串或对象）
 * @returns 解析后的 HAR 对象或错误
 */
export function parseHar(harContent: string | object): Har {
  try {
    let harObject: Har;

    if (typeof harContent === "string") {
      harObject = JSON.parse(harContent) as Har;
    } else {
      harObject = harContent as Har;
    }

    // 验证必要的字段
    if (
      !harObject.log || !harObject.log.entries ||
      !Array.isArray(harObject.log.entries)
    ) {
      throw new Error("无效的 HAR 格式：缺少必要的 log.entries 字段");
    }

    if (!harObject.log.version) {
      throw new Error("无效的 HAR 格式：缺少必要的 log.version 字段");
    }

    return harObject;
  // deno-lint-ignore no-explicit-any
  } catch (error:any) {
    throw new Error(`解析 HAR 内容失败: ${error.message}`);
  }
}

/**
 * 将 HAR 请求对象转换为 HTTP 请求明文
 * @param request HAR 请求对象
 * @returns HTTP 请求明文
 */
export function harRequestToHttpText(request: HarRequest): string {
  // 构建请求行
  let httpText =
    `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`;

  // 添加请求头
  for (const header of request.headers) {
    httpText += `${header.name}: ${header.value}\r\n`;
  }

  // 添加空行，分隔头部和正文
  httpText += "\r\n";

  // 添加请求体（如果有）
  if (request.postData && request.postData.text) {
    httpText += request.postData.text;
  }

  return httpText;
}

/**
 * 将 HAR 响应对象转换为 HTTP 响应明文
 * @param response HAR 响应对象
 * @returns HTTP 响应明文
 */
export function harResponseToHttpText(response: HarResponse): string {
  // 构建状态行
  let httpText =
    `HTTP/${response.httpVersion} ${response.status} ${response.statusText}\r\n`;

  // 添加响应头
  for (const header of response.headers) {
    httpText += `${header.name}: ${header.value}\r\n`;
  }

  // 添加空行，分隔头部和正文
  httpText += "\r\n";

  // 添加响应体（如果有）
  if (response.content && response.content.text) {
    httpText += response.content.text;
  }

  return httpText;
}

/**
 * 将 HAR 条目转换为 HTTP 请求和响应明文
 * @param entry HAR 条目
 * @returns 包含 HTTP 请求和响应明文的对象
 */
export function harEntryToHttpText(
  entry: HarEntry,
): { request: string; response: string } {
  return {
    request: harRequestToHttpText(entry.request),
    response: harResponseToHttpText(entry.response),
  };
}

/**
 * 将整个 HAR 文件转换为 HTTP 请求和响应明文数组
 * @param harContent HAR 文件内容（字符串或对象）
 * @returns HTTP 请求和响应明文数组
 */
export function harToHttpText(
  harContent: string | object,
): { request: string; response: string }[]  {
  const har = parseHar(harContent);
  return  har.log.entries.map(harEntryToHttpText);
}
