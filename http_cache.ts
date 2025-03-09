// // http_cache.ts
// import { crypto, DigestAlgorithm } from "https://deno.land/std@0.200.0/crypto/mod.ts";
// import { serializeRequestToHttpRaw } from "./http_serialize.ts";

// interface CacheEntry {
//   response: Response;
//   headers: Headers;
//   expiresAt: number; // 过期时间戳（毫秒）
// }

// type HttpCacheOptions = {
//   defaultTTL?: number;
//   algorithm?: DigestAlgorithm;
//   autoCleanupInterval?: number;

// };

// export class HttpCache {
//   private cache = new Map<string, CacheEntry>();
//   private defaultTTL: number;
//   private hashAlgorithm: DigestAlgorithm;
//   private cleanupIntervalId: number | null = null;

//   constructor(options: HttpCacheOptions = {}) {
//     this.defaultTTL = options.defaultTTL ?? 300; // 默认 5 分钟
//     this.hashAlgorithm = options.algorithm ?? "SHA-256";

//     const interval = options.autoCleanupInterval ?? 60;
//     if (interval > 0) {  // 仅当间隔>0时启动自动清理
//       this.startAutoCleanup(interval * 1000);
//     }
//   }


//     /**
//    * 启动自动清理定时任务
//    * @param intervalMs 间隔时间（毫秒）
//    * @private
//    */
//     private startAutoCleanup(intervalMs: number): void {
//       this.cleanupIntervalId = setInterval(() => {
//         this.clearExpired();
//       }, intervalMs) as unknown as number;
//     }
//   get size(): number {
//     this.clearExpired(); // 统计前自动清理
//     return this.cache.size; // 只返回有效条目数
//   }
  
//   private async hashRequest(request: Request): Promise<string> {
//     try {
//       const rawRequest = await serializeRequestToHttpRaw(request.clone());
//       const encoder = new TextEncoder();
//       const hashBuffer = await crypto.subtle.digest(
//         this.hashAlgorithm,
//         encoder.encode(rawRequest)
//       );
//       return Array.from(new Uint8Array(hashBuffer))
//         .map((b) => b.toString(16).padStart(2, "0"))
//         .join("");
//     } catch (error) {
//       throw new Error(`请求哈希生成失败: ${ (error as Error)?.message}`);
//     }
//   }

//   async set(request: Request, response: Response, ttl?: number): Promise<void> {
//     const key = await this.hashRequest(request);
//     const finalTTL = (ttl ?? this.defaultTTL) * 1000;
//     let expiresAt=Date.now() + finalTTL;
//     this.cache.set(key, {
//       response: response.clone(),
//       headers: new Headers(response.headers),
//       expiresAt
//     });
//   }

//   async get(request: Request): Promise<Response | undefined> {
//     const key = await this.hashRequest(request);
//     const entry = this.cache.get(key);

//     if (!entry) return undefined;

//     if (Date.now() > entry.expiresAt) {
//       this.cache.delete(key);
//       return undefined;
//     }

//     return entry.response.clone();
//   }

//   clearExpired(): void {
//     let now = Date.now();
//     Array.from(this.cache.entries()).forEach(([key, entry]) => {
//       if (entry.expiresAt <= now){
        
//         this.cache.delete(key)

//       };
//     });
// }

//   getAllEntries(): Array<{ key: string; headers: [string, string][]; expiresAt: Date }> {
//     return Array.from(this.cache.entries()).map(([key, entry]) => ({
//       key,
//       headers: Array.from(entry.headers.entries()),
//       expiresAt: new Date(entry.expiresAt)
//     }));
//   }

//   clear(): void {
//     this.cache.clear();
//   }

//   async has(request: Request): Promise<boolean> {
//     const key = await this.hashRequest(request);
//     return this.cache.has(key);
//   }
// }
