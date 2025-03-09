// FILEPATH: e:/deno_mitm/core/core/fuzz.ts

import { HttpUtils } from './mod.ts';

// HTTP 方法枚举
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE',
  CONNECT = 'CONNECT',
}

// 参数类型枚举
export enum ParamType {
  QUERY = 'query',
  PATH = 'path',
  HEADER = 'header',
  COOKIE = 'cookie',
  BODY = 'body',
  FORM = 'form',
  JSON = 'json',
  XML = 'xml',
  File = 'file',
  MULTIPART = 'multipart',
}

// Fuzz 参数接口
export interface FuzzParam {
  name: string;
  value: string | string[];
  position: ParamType;
  isArray?: boolean;
  metadata?: {
    contentType?: string;
    pathTemplate?: string;
    security?: boolean;
    [key: string]: unknown;
  };
}
export class Fuzz {
  private isInitialized: boolean = false;
  private initPromise!: Promise<void>;
  private request!: Request;

  private params: FuzzParam[] = [];
  requestBody!: string;
  async initialize(): Promise<void> {
    await this.parseAllParams();
    this.isInitialized = true;
  }

  /**
   * 生成一个安全的32位整数减法表达式
   * @returns 包含表达式、操作数和结果的对象
   */
  static calcExprInt32Safe(): { expr: string; num1: number; num2: number; result: number } {
    // 生成两个安全的32位整数
    const num1 = Math.floor(Math.random() * (2 ** 31 - 1));
    const num2 = Math.floor(Math.random() * num1); // 确保 num2 <= num1，避免负数结果

    const result = num1 - num2;
    const expr = `${num1} - ${num2}`;

    return { expr, num1, num2, result };
  }

  /**
   * 从Request对象创建一个新的Fuzz实例
   * @param req - 要处理的Request对象
   * @returns 一个Promise，解析为初始化完成的Fuzz实例
   */
  static async fromRequest(req: Request): Promise<Fuzz> {
    const fuzz = new Fuzz(req);
    await fuzz.initialize();
    return fuzz;
  }

  private async parseAllParams(): Promise<void> {
    await Promise.all([
      this.parseQueryParams(),
      this.parsePathParams(),
      this.parseBodyParams(),
      this.parseCookies(),
      this.parseHeaders(),
    ]);
  }
  static fuzzCalcExpr(): { expr: string; result: number } {
    const operators = ['+', '-', '*'];
    const num1 = Math.floor(Math.random() * 1000);
    const num2 = Math.floor(Math.random() * 1000);
    const operator = operators[Math.floor(Math.random() * operators.length)];

    const expr = `${num1}${operator}${num2}`;
    let result: number;

    switch (operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      default:
        throw new Error('Unexpected operator');
    }

    return { expr, result };
  }

  private constructor(private req: Request) {
    this.request = req;
    this.initPromise = this.initialize();
  }

  /** 获取所有可模糊测试的参数 */
  getAllFuzzableParams(): FuzzParam[] {
    return this.params.filter((p) => !['header', 'cookie'].includes(p.position) // 排除敏感参数
    );
  }

  /** 获取所有参数（含header/cookie） */
  getAllParams(): FuzzParam[] {
    return [...this.params];
  }

  // 确保初始化完成的辅助方法
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initPromise;
    }
  }

  /**
   * 发送原始请求
   * @returns {Promise<Response>} 返回原始请求的响应
   */
  async sendOriginalRequest(): Promise<Response> {
    return fetch(this.request);
  }

  async sendModifiedRequestEx(modifiedParam: FuzzParam) {
    let start = Date.now();
    let res = await this.sendModifiedRequest(modifiedParam);
    return { ...res, duration: Date.now() - start };
  }

  /**
   * 使用修改后的单个参数重新发送请求
   * @param modifiedParam 修改后的单个参数
   * @returns {Promise<Response>} 返回新请求的响应
   */
  async sendModifiedRequest(modifiedParam: FuzzParam): Promise<{ request: Request; response: Response }> {
    // 创建新的 URL 对象
    const url = new URL(this.request.url);

    // 创建新的 Headers 对象
    const headers = new Headers(this.request.headers);

    // 创建新的 body
    let body: BodyInit | null = null;

    // 如果还没有读取过请求体，先读取并保存
    if (this.requestBody === null) {
      this.requestBody = await this.request.text();
    }
    // 处理 modifiedParam.value 可能是数组的情况
    const paramValues = Array.isArray(modifiedParam.value) ? modifiedParam.value : [modifiedParam.value];

    // 更新参数
    switch (modifiedParam.position) {
      case ParamType.QUERY:
        url.searchParams.delete(modifiedParam.name);
        for (const value of paramValues) {
          url.searchParams.append(modifiedParam.name, value);
        }
        break;
      case ParamType.HEADER:
        headers.delete(modifiedParam.name);
        for (const value of paramValues) {
          headers.append(modifiedParam.name, value);
        }
        break;
      case ParamType.COOKIE:
        // 更新 Cookie header
        const cookies = (headers.get('cookie') || '').split(';')
          .map((c) => c.trim())
          .filter((c) => !c.startsWith(`${modifiedParam.name}=`));
        for (const value of paramValues) {
          cookies.push(`${modifiedParam.name}=${value}`);
        }
        headers.set('cookie', cookies.join('; '));
        break;
      case ParamType.BODY:
      case ParamType.FORM:
      case ParamType.JSON:
      case ParamType.XML:
      case ParamType.MULTIPART:
        // 对于 body 相关的参数，我们需要重建整个 body
        const contentType = headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const jsonBody = JSON.parse(this.requestBody || '{}');
          jsonBody[modifiedParam.name] = paramValues.length > 1 ? paramValues : paramValues[0];
          body = JSON.stringify(jsonBody);
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = new URLSearchParams(this.requestBody || '');
          formData.delete(modifiedParam.name);
          for (const value of paramValues) {
            formData.append(modifiedParam.name, value);
          }
          body = formData.toString();
        }
        break;
    }
    console.log(`fuzz:url`, url.href);
    const request = new Request(url.toString(), {
      method: this.request.method,
      headers: headers,
      body: body || this.requestBody || undefined,
      redirect: this.request.redirect,
      signal: this.request.signal,
    });
    // 发送新的请求
    return { request, response: await fetch(request) };
  }

  /** 解析URL查询参数 */
  private parseQueryParams(): void {
    const url = new URL(this.request.url);
    url.searchParams.forEach((value, name) => {
      const values = url.searchParams.getAll(name);
      this.params.push({
        name,
        value: values.length > 1 ? values : value,
        position: ParamType.QUERY,
        isArray: values.length > 1,
        metadata: { pathTemplate: url.pathname },
      });
    });
  }

  /** 解析RESTful路径参数 */
  private parsePathParams(): void {
    const urlPaths = new URL(this.request.url).pathname.split('/');
    const templatePaths = this.getPathTemplate().split('/');

    templatePaths.forEach((segment, index) => {
      if (segment.startsWith(':')) {
        const paramName = segment.slice(1);
        this.params.push({
          name: paramName,
          value: urlPaths[index] || '',
          position: ParamType.PATH,
          isArray: false,
          metadata: { pathTemplate: this.getPathTemplate() },
        });
      }
    });
  }

  // ... 其他方法保持不变 ...

  /** 解析请求体参数 */
  private async parseBodyParams(): Promise<void> {
    const contentType = this.request.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      let req = await HttpUtils.cloneHttp(this.request);
      const formData = await req.formData();
      formData.forEach((value, name) => {
        const values = formData.getAll(name);
        this.params.push({
          name,
          value: values.length > 1 ? values.map((v) => v.toString()) : value.toString(),
          position: ParamType.FORM,
          isArray: values.length > 1,
        });
      });
    } else if (contentType.includes('application/json')) {
      try {
        const jsonBody = await this.request.json();
        this.flattenJSON('', jsonBody, ParamType.JSON);
      } catch (e) {
        console.error('JSON解析失败:', e);
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await this.request.formData();
      formData.forEach((value, name) => {
        const values = formData.getAll(name);
        this.params.push({
          name,
          value: values.length > 1
            ? values.map((v) => v instanceof File ? v as any : v.toString())
            : (value instanceof File ? value as any : value.toString()),
          position: ParamType.File,
          isArray: values.length > 1,
          metadata: {
            contentType: value instanceof File ? value.type : 'text/plain',
          },
        });
      });
    }
  }

  /** 展平JSON数据结构 */
  private flattenJSON(prefix: string, data: any, position: ParamType): void {
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (Array.isArray(value)) {
          this.params.push({
            name: fullKey,
            value: value.map((v) => String(v)),
            position,
            isArray: true,
            metadata: { contentType: 'application/json' },
          });
        } else if (typeof value === 'object') {
          this.flattenJSON(fullKey, value, position);
        } else {
          this.params.push({
            name: fullKey,
            value: String(value),
            position,
            isArray: false,
            metadata: { contentType: 'application/json' },
          });
        }
      });
    }
  }

  /** 解析Cookie参数 */
  private parseCookies(): void {
    const cookieHeader = this.request.headers.get('cookie') || '';
    cookieHeader.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        this.params.push({
          name,
          value: value || '',
          position: ParamType.COOKIE,
          isArray: false,
          metadata: { security: cookie.includes('Secure') },
        });
      }
    });
  }

  /** 解析特殊Header参数 */
  private parseHeaders(): void {
    const sensitiveHeaders = ['authorization', 'token', 'x-api-key'];
    this.request.headers.forEach((value, name) => {
      if (!sensitiveHeaders.includes(name.toLowerCase())) {
        this.params.push({
          name: `Header:${name}`,
          value,
          position: ParamType.HEADER,
          isArray: false,
        });
      }
    });
  }

  /** 路径模板检测（需要实现实际路由匹配逻辑） */
  private getPathTemplate(): string {
    // 示例实现：假设已配置的路由模板
    // 实际项目应集成路由解析库
    const templates = [
      '/users/:id/posts/:postId',
      '/api/:version/products',
    ];

    const currentPath = new URL(this.request.url).pathname;
    return templates.find((t) =>
      t.split('/').length === currentPath.split('/').length &&
      t.split('/').every((seg, i) => seg.startsWith(':') || seg === currentPath.split('/')[i])
    ) || currentPath;
  }

  async fuzzPostRaw(body: string | FormData, requestInit?: RequestInit): Promise<Response> {
    let fuzzedBody: any;
    if (body instanceof FormData) {
      fuzzedBody = body;
      // this.request.headers.delete('content-type')
    } else {
      fuzzedBody = body as string;

      // 替换随机字符串
      fuzzedBody = fuzzedBody.replace(/{{randstr\((\d+)\)}}/g, (_: any, length: any) => {
        return this.generateRandomString(parseInt(length));
      });
    }

    // 创建新的 RequestInit 对象，合并传入的 requestInit
    const mergedRequestInit: RequestInit = {
      ...requestInit,
      method: requestInit?.method || 'POST',
      headers: {
        ...this.request.headers,
        ...requestInit?.headers,
      },
      body: fuzzedBody,
    };
    // console.log('mergedRequest init',mergedRequestInit)

    try {
      // 使用合并后的 RequestInit 创建新的 Request 对象
      const request = new Request(this.request.url || '', mergedRequestInit);
      // console.log(await HttpUtils.dumpRequest(request));
      // 发送请求
      return await fetch(request);
    } catch (error) {
      console.error('Error sending request:', error);
      throw error;
    }
  }

  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
  }

  private constructMultipartBody(body: string, boundary: string): string {
    // 这里需要实现将 body 转换为 multipart/form-data 格式的逻辑
    // 这是一个简化的示例
    return `--${boundary}\r\nContent-Disposition: form-data; name="data"\r\n\r\n${body}\r\n--${boundary}--\r\n`;
  }
}
