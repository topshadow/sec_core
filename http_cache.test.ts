// http_cache.test.ts
import { 
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.200.0/assert/mod.ts";
import { HttpCache } from "./http_cache.ts";

// 通用等待函数 (核心时间控制)
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

Deno.test("基本缓存生命周期", async () => {
  const cache = new HttpCache({ defaultTTL: 1 }); // 设置1秒TTL
  const request = new Request("https://example.com");
  
  // 初始缓存
  await cache.set(request, new Response("data"));
  assert(await cache.get(request), "刚写入应能读取缓存");

  // 等待0.9秒后验证缓存存在
  await wait(900);
  assert(await cache.get(request), "未过期应保留");

  // 等待额外200ms (累计1.1秒) 触发过期
  await wait(200);
  assertFalse(await cache.get(request), "超时后应自动删除");
});

Deno.test("自定义TTL优先级", async () => {
  const cache = new HttpCache({ defaultTTL: 10,autoCleanupInterval:1 });
  const request = new Request("https://test.com");
  
  // 使用2秒自定义TTL
  await cache.set(request, new Response(), 2);
  assert(await cache.has(request));

  // 等待1500ms后检查
  await wait(1500);
  assert(await cache.has(request), "1.5秒未超时应存在");

  // 等待600ms累计2.1秒触发过期
  await wait(2000);
  assertFalse(await cache.has(request));
});

Deno.test("手动清理验证", async () => {
  const cache = new HttpCache();
  await cache.set(new Request("http://a.com"), new Response());
  await cache.set(new Request("http://b.com"), new Response());

  assertEquals(cache.size, 2);
  cache.clear();
  assertEquals(cache.size, 0);
});

Deno.test("被动过期清理机制", async () => {
  const cache = new HttpCache({ defaultTTL: 0.3 }); // 300ms TTL
  const req1 = new Request("http://test1.com");
  const req2 = new Request("http://test2.com");
  
  await cache.set(req1, new Response());
  await cache.set(req2, new Response());
  assertEquals(cache.size, 2);

  // 触发第一个请求的过期检查
  await wait(500);
  await cache.get(req1);
  assertEquals(cache.size, 1, "应清理req1");

  // 多次get触发最终清理
  await cache.get(req2);
  assertEquals(cache.size, 0, "应清理req2");
});
