// import { HttpCache } from './http_cache.ts';
import {
  parseHttpRawToRequest,
  parseHttpRawToResponse,
  serializeRequestToHttpRaw,
  serializeResponseToHttpRaw,
} from './http_serialize.ts';

export class HttpUtils {
  /**
   * parse http  raw to request
   */
  public static parseRequest = parseHttpRawToRequest;
  /**
   * serialize request to http raw
   */
  public static dumpRequest = serializeRequestToHttpRaw;

  public static parseResponse = parseHttpRawToResponse;

  public static dumpResponse = serializeResponseToHttpRaw;
  public static cloneHttp<T extends Request | Response>(input: T): Promise<T> {
    if (input instanceof Request) {
      return this.dumpRequest(input).then(this.parseRequest) as Promise<T>;
    } else {
      return this.dumpResponse(input).then(this.parseResponse) as Promise<T>;
    }
  }
}

// export { HttpCache };
export * from './fuzz.ts';
export * as str from './str.ts';
export * as xhtml from './xhtml.ts';
export * as js from './js.ts';
export * as db from './db.ts';
export * as codec from './codec.ts';
export * as poc from './poc.ts';
export * as common from './common.ts';
export * as risk from './risk.ts';
export * as re from './re.ts';
