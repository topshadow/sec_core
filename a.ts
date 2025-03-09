import { HttpCache } from './http_cache.ts';
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const cache = new HttpCache({ defaultTTL: 10,autoCleanupInterval:1 });
  const request = new Request("https://test.com");
  
  // 使用2秒自定义TTL
  await cache.set(request, new Response(), 2);
//   assert(await cache.has(request));

  // 等待1500ms后检查
  await wait(1500);
//   assert(await cache.has(request), "1.5秒未超时应存在");

  // 等待600ms累计2.1秒触发过期
  await wait(2000);
//   assertFalse();

  console.log(await cache.has(request))