/**
 * HAR 模块测试
 */

import { assertEquals } from "@std/assert";
import { harEntryToHttpText, harToHttpText, parseHar } from "./har.ts";

// 示例 HAR 内容
const exampleHar = {
  "log": {
    "version": "1.2",
    "creator": {
      "name": "WebInspector",
      "version": "537.36",
    },
    "entries": [
      {
        "startedDateTime": "2023-01-01T00:00:00.000Z",
        "time": 200,
        "request": {
          "method": "GET",
          "url": "https://example.com/",
          "httpVersion": "1.1",
          "headers": [
            {
              "name": "Host",
              "value": "example.com",
            },
            {
              "name": "User-Agent",
              "value": "Mozilla/5.0",
            },
            {
              "name": "Accept",
              "value": "text/html",
            },
          ],
          "queryString": [],
          "cookies": [],
          "headersSize": 150,
          "bodySize": 0,
        },
        "response": {
          "status": 200,
          "statusText": "OK",
          "httpVersion": "1.1",
          "headers": [
            {
              "name": "Content-Type",
              "value": "text/html; charset=UTF-8",
            },
            {
              "name": "Content-Length",
              "value": "1256",
            },
            {
              "name": "Date",
              "value": "Wed, 01 Jan 2023 00:00:00 GMT",
            },
          ],
          "cookies": [],
          "content": {
            "size": 1256,
            "mimeType": "text/html",
            "text":
              "<!DOCTYPE html><html><head><title>Example Domain</title></head><body><h1>Example Domain</h1><p>This domain is for use in illustrative examples in documents.</p></body></html>",
          },
          "redirectURL": "",
          "headersSize": 200,
          "bodySize": 1256,
        },
        "cache": {},
        "timings": {
          "send": 0,
          "wait": 100,
          "receive": 100,
        },
      },
    ],
  },
};

// 测试 1: 解析 HAR 内容
Deno.test("解析 HAR 内容", () => {
  const parsedHar = parseHar(exampleHar);

  assertEquals(parsedHar.log.entries.length, 1);
  assertEquals(parsedHar.log.version, "1.2");
  assertEquals(parsedHar.log.creator.name, "WebInspector");
});

// 测试 2: 将 HAR 条目转换为 HTTP 请求和响应明文
Deno.test("将 HAR 条目转换为 HTTP 明文", () => {
  const parsedHar = parseHar(exampleHar);
  if (parsedHar instanceof Error) {
    throw parsedHar;
  }
  
  const entry = parsedHar.log.entries[0];
  const httpText = harEntryToHttpText(entry);
  
  // 验证请求明文
  const expectedRequest = 
    "GET https://example.com/ HTTP/1.1\r\n" +
    "Host: example.com\r\n" +
    "User-Agent: Mozilla/5.0\r\n" +
    "Accept: text/html\r\n\r\n";
  
  assertEquals(httpText.request, expectedRequest);
  
  // 验证响应明文
  const expectedResponse = 
    "HTTP/1.1 200 OK\r\n" +
    "Content-Type: text/html; charset=UTF-8\r\n" +
    "Content-Length: 1256\r\n" +
    "Date: Wed, 01 Jan 2023 00:00:00 GMT\r\n\r\n" +
    "<!DOCTYPE html><html><head><title>Example Domain</title></head><body><h1>Example Domain</h1><p>This domain is for use in illustrative examples in documents.</p></body></html>";
  
  assertEquals(httpText.response, expectedResponse);
});

// 测试 3: 将整个 HAR 文件转换为 HTTP 明文数组
Deno.test("将整个 HAR 文件转换为 HTTP 明文数组", () => {
  const httpTexts = harToHttpText(exampleHar);
  
  assertEquals(httpTexts.length, 1);
  
  // 验证第一个条目的请求明文
  const expectedRequest = 
    "GET https://example.com/ HTTP/1.1\r\n" +
    "Host: example.com\r\n" +
    "User-Agent: Mozilla/5.0\r\n" +
    "Accept: text/html\r\n\r\n";
  
  assertEquals(httpTexts[0].request, expectedRequest);
  
  // 验证第一个条目的响应明文
  const expectedResponse = 
    "HTTP/1.1 200 OK\r\n" +
    "Content-Type: text/html; charset=UTF-8\r\n" +
    "Content-Length: 1256\r\n" +
    "Date: Wed, 01 Jan 2023 00:00:00 GMT\r\n\r\n" +
    "<!DOCTYPE html><html><head><title>Example Domain</title></head><body><h1>Example Domain</h1><p>This domain is for use in illustrative examples in documents.</p></body></html>";
  
  assertEquals(httpTexts[0].response, expectedResponse);
});

// 测试 4: 处理无效的 HAR 内容
Deno.test("处理无效的 HAR 内容", () => {
  const invalidHar = { log: { version: "1.2" } }; // 缺少 entries 字段
  
  try {
    const result = parseHar(invalidHar);
    // 如果没有抛出错误，则测试失败
    assertEquals(true, false, "应该抛出错误但没有");
  } catch (error) {
    // 验证错误信息
    assertEquals(error instanceof Error, true);
    assertEquals(error.message.includes("缺少必要的 log.entries 字段"), true);
  }
});