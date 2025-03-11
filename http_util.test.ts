// request_converter_test.ts
import { assertEquals } from 'https://deno.land/std@0.200.0/assert/mod.ts';
import  * as httpUtil from './http_util.ts';
import got from 'npm:got';
Deno.test('GET请求不应携带Body（RAW → Request）', async () => {
  const rawGetWithBody = [
    'GET /data HTTP/1.1',
    'Host: example.com',
    'Content-Type: text/plain',
  ].join('\r\n');

  const request = await httpUtil.parseRequest(rawGetWithBody);
  assertEquals(request.method, 'GET');
  assertEquals(await request.text(), ''); // Body 被强制清空
});

Deno.test('GET转换完整性测试', async () => {
  const validRawGet = [
    'GET /api/v1/users?page=2 HTTP/1.1',
    'Host: api.example.com',
    'Accept: application/json',
  ].join('\r\n');

  const request = await httpUtil.parseRequest(validRawGet);

  assertEquals(request.method, 'GET');
  assertEquals(new URL(request.url).searchParams.get('page'), '2');
  assertEquals(await request.text(), ''); // 无 Body

  const regenerated = await httpUtil.dumpRequest(request);
  assertEquals(
    regenerated,
    [
      'GET /api/v1/users?page=2 HTTP/1.1',
      'Host: api.example.com',
      'Accept: application/json',
      '',
      '',
    ].join('\r\n'),
  );
});

Deno.test('POST请求保留Body', async () => {
  const rawPost = [
    'POST /submit HTTP/1.1',
    'Host: api.example.com',
    'Content-Type: application/json',
    'Content-Length: 28',
    '',
    '{"data":"deno_is_awesome"}',
  ].join('\r\n');

  const request = await httpUtil.parseRequest(rawPost);
  assertEquals(request.method, 'POST');
  assertEquals(await request.json(), { data: 'deno_is_awesome' });

  const regenerated = await httpUtil.dumpRequest(request);
  assertEquals(
    regenerated,
    [
      'POST /submit HTTP/1.1',
      'Host: api.example.com',
      'Content-Type: application/json',
      'Content-Length: 28',
      '',
      '{"data":"deno_is_awesome"}',
    ].join('\r\n'),
  );
});

Deno.test('完整响应生命周期测试 (RAW ↔ Response)', async () => {
  const rawResponse = [
    'HTTP/1.1 200 OK',
    'content-length: 27',

    'content-type: text/html; charset=utf-8',
    'Set-Cookie: session=abc123',
    '',
    '<h1>Hello Deno Response!</h1>',
  ].join('\r\n');

  // 解析测试
  const response = (await httpUtil.parseResponse(rawResponse)).clone();
  assertEquals(response.status, 200);
  assertEquals(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assertEquals(response.headers.getSetCookie(), ['session=abc123']);
  assertEquals(await response.clone().text(), '<h1>Hello Deno Response!</h1>');

  // 序列化测试
  const regeneratedRaw = await httpUtil.dumpResponse(response);
  console.log(regeneratedRaw, '\n', rawResponse);
  assertEquals(regeneratedRaw, rawResponse);
});

Deno.test('分块编码响应处理', async () => {
  const chunkedResponse = [
    'HTTP/1.1 200 OK',
    'Transfer-Encoding: chunked',
    '',
    '7\r\n',
    'Chunk 1\r\n',
    '6\r\n',
    'Chunk2\r\n',
    '0\r\n',
    '\r\n',
  ].join('\r\n');

  const response = await httpUtil.parseResponse(chunkedResponse);
  let responseText = await response.clone().text();
  console.log('responsetext:', responseText);
  assertEquals(responseText, 'Chunk 1Chunk2');
  assertEquals(response.headers.get('Content-Length'), '11');
});

Deno.test('二进制数据响应处理', async () => {
  const buffer = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  const response = new Response(buffer, {
    headers: { 'Content-Type': 'application/octet-stream' },
  });

  const raw = await httpUtil.dumpResponse(response);
  const parsedResponse = await httpUtil.parseResponse(raw);

  assertEquals(
    new Uint8Array(await parsedResponse.arrayBuffer()),
    buffer,
  );
});

Deno.test('错误状态码处理', async () => {
  const errorResponse = [
    'HTTP/1.1 404 Not Found',
    'Content-Type: application/json',
    '',
    '{"error": "Not Found"}',
  ].join('\r\n');

  const response = await httpUtil.parseResponse(errorResponse);
  assertEquals(response.status, 404);
  assertEquals(await response.json(), { error: 'Not Found' });
});

Deno.test('serializeRequestToHttpRaw', async () => {
  let req = new Request('http://localhost:8787/csrf/unsafe', {
    'headers': {
      'accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'zh-CN,zh;q=0.9',
      'cache-control': 'max-age=0',
      'content-type': 'application/x-www-form-urlencoded',
      'sec-ch-ua': '"Not-A.Brand";v="99", "Chromium";v="124"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'cookie': 'vulCookie=confidential_cookie',
      'Referer': 'http://localhost:8787/csrf/unsafe',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    'body': 'info=sad',
    'method': 'POST',
  });
  let reqDump = await httpUtil.dumpRequest(req);
  console.log(reqDump);
});

Deno.test(`redirect`, async () => {
  let postReqStr =
    'POST /csrf/unsafe HTTP/1.1\r\naccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7\r\ncontent-type: application/x-www-form-urlencoded\r\nhost: localhost:8787\r\norigin: http://localhost:8787\r\nreferer: http://localhost:8787/csrf/unsafe\r\nsec-ch-ua: "Not-A.Brand";v="99", "Chromium";v="124"\r\nsec-ch-ua-mobile: ?0\r\nsec-ch-ua-platform: "Windows"\r\nupgrade-insecure-requests: 1\r\nuser-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36\r\n\r\ninfo=aa';
  let req = await httpUtil.parseRequest(postReqStr);
  console.log(req.headers);

  // let form = new FormData();
  // form.append('info','aa')
  await fetch(req.url, {
    // url: req.url,
    method: req.method.toUpperCase(),
    headers: { 'Content-Type': req.headers.get('content-type') } as any,
    body: encodeURIComponent('info') + '=' + encodeURIComponent('aa') as any,
    redirect: 'follow',
  }).then((r) => {
    if (r.type == 'opaqueredirect') {
      const redirectUrl = r.headers.get('Location') || '';

      return fetch(redirectUrl);
    }
  });

  // const url = "https://nobat.ir/doctor/%D8%AF%DA%A9%D8%AA%D8%B1-%D8%B3%DB%8C%D8%AF-%D9%85%D8%AD%D9%85%D8%AF-%D9%82%D8%B1%DB%8C%D8%B4%DB%8C-%D8%AA%D9%87%D8%B1%D8%A7%D9%86/dr-14917/";
  // const text = await fetch(url).then(r => r.text());
  // console.log(text)
});

Deno.test('redirect2', async () => {
  let client= Deno.createHttpClient({})
  await fetch('http://localhost:8787/csrf/unsafe', {
    'headers': {
      'accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
      'cache-control': 'max-age=0',
      'sec-ch-ua': '"Not(A:Brand";v="99", "Microsoft Edge";v="133", "Chromium";v="133"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'Referer': 'http://localhost:8787/csrf/unsafe',
      'Referrer-Policy': 'strict-origin-when-cross-origin',

      'content-type': 'application/x-www-form-urlencoded',
    },
    'body': 'info=sad',
    'method': 'POST',
    redirect: 'follow',
    client:client
  });
});
