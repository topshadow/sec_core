// request_converter.ts

/**
 * 将 HTTP RAW 字符串转换为 Deno Request 对象
 * @param rawRequest - 原始 HTTP 请求字符串
 * @returns Deno.Request 对象
 */
export async function parseHttpRawToRequest(rawRequest: string): Promise<Request> {
    const [requestLineAndHeaders, ...bodyParts] = rawRequest.split('\r\n\r\n');
    const [requestLine, ...headerLines] = requestLineAndHeaders.split('\r\n');
    
    // 解析请求行
    const [method, pathWithQuery, protocol] = requestLine.split(' ');
    const url = new URL(pathWithQuery, 'http://placeholder'); // 临时占位域名
    
    // 解析 Headers
    const headers = new Headers();
    for (const line of headerLines) {
      const [name, value] = line.split(': ', 2);
      if (name.toLowerCase() === 'host') {
        url.host = value; // 替换真实 host
      }
      headers.append(name, value);
    }
  
    // 构建完整 URL
    url.protocol = protocol.startsWith('HTTP/') ? 'http:' : 'https:';
    
    // 处理请求体
    const body = bodyParts.join('\r\n\r\n');
    
    return new Request(url.toString(), {
      method,
      headers,
      body: body || undefined
    });
  }
  
  /**
   * 将 Deno Request 对象转换为 HTTP RAW 字符串
   * @param request - Deno Request 对象
   * @returns 原始 HTTP 请求字符串
   */
  export async function serializeRequestToHttpRaw(request: Request): Promise<string> {
    const url = new URL(request.url);
    const method = request.method;
    
    // 构建请求行
    const pathWithQuery = url.pathname + (url.search ? url.search : '');
    const requestLine = `${method} ${pathWithQuery} HTTP/1.1`;
    
    // 处理 Headers
    const headers = new Headers(request.headers);
    headers.set('Host', url.host);
    
    // 生成 headers 字符串
    const headerLines = Array.from(headers.entries())
      .map(([name, value]) => `${name}: ${value}`)
      .join('\r\n');
    
    // 处理请求体
    const body = await request.clone().text();
    
    return [
      requestLine,
      headerLines,
      '',
      body
    ].join('\r\n');
  }
  
  


  // response_converter.ts

const CRLF = "\r\n";

/**
 * 将 HTTP 原始响应字符串解析为 Deno Response 对象
 * @param rawResponse - 原始 HTTP 响应字符串
 * @returns Deno.Response 对象
 */
export async function parseHttpRawToResponse(rawResponse: string): Promise<Response> {
  const [statusAndHeaders, ...bodyParts] = rawResponse.split(CRLF + CRLF);
  const [statusLine, ...headerLines] = statusAndHeaders.split(CRLF);

  // 解析状态行
  const [,protocolVersion, statusStr, statusText] = statusLine.match(/^HTTP\/(\d\.\d) (\d{3}) (.*)$/) || [];
  const status = parseInt(statusStr || "200", 10);

  // 处理响应头
  const headers = new Headers();
  headerLines.forEach(line => {
    const [name, ...values] = line.split(": ");
    if (name) headers.append(name, values.join(": "));
  });

  // 处理响应体
  let body = bodyParts.join(CRLF + CRLF);
  
  // 处理分块传输编码 (chunked)
  if (headers.get("Transfer-Encoding")?.toLowerCase() === "chunked") {
    body = decodeChunkedBody(body);
    headers.delete("Transfer-Encoding");
    headers.set("Content-Length", body.length.toString());
  }

  return new Response(body, {
    status,
    statusText,
    headers
  });
}

/**
 * 将 Deno Response 对象序列化为 HTTP 原始响应字符串
 * @param response - Deno Response 对象
 * @returns 原始 HTTP 响应字符串
 */
export async function serializeResponseToHttpRaw(response: Response): Promise<string> {
  // 构建状态行
  const statusLine = `HTTP/1.1 ${response.status} ${response.statusText || "OK"}`;

  // 处理响应头（保留 Set-Cookie 的多值特性）
  const headers = [];
  const seenCookies = new Set();
  
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() === "set-cookie") {
      // 单独处理多个 Set-Cookie 头
      for (const cookie of response.headers.getSetCookie()) {
        headers.push(`Set-Cookie: ${cookie}`);
      }
      seenCookies.add(name.toLowerCase());
    } else if (!seenCookies.has(name.toLowerCase())) {
      headers.push(`${name}: ${value}`);
    }
  }

  // 处理响应体
  const body = await response.text();
  
  return [
    statusLine,
    ...headers,
    "", // headers 和 body 之间的空行
    body
  ].join(CRLF);
}

// 分块编码解码器
function decodeChunkedBody(chunkedBody: string): string {
  const chunks = chunkedBody.split(CRLF);
  let result = "";
  let hexLength: number;

  for (let i = 0; i < chunks.length;) {
    hexLength = parseInt(chunks[i], 16);
    if (isNaN(hexLength)) break;
    if (hexLength === 0) break; // 结束块
    result += chunks[i + 1];
    i += 2;
  }

  return result;
}
