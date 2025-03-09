import { Database } from "@db/sqlite";
// 定义漏洞记录的接口
export interface Vulnerability {
  id: string;
  url: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  payload: string;
  timestamp: number;
  reqRaw?: string;
  resRaw?: string;

  domain: string; // 新增 domain 字段
}

// 定义扫描任务的接口
export interface ScanTask {
  id: string;
  target: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

// 漏洞数据库操作
// export class VulnerabilityDB {
//   constructor(private kv: Deno.Kv) {
//     Deno.env.set('DENO_KV_ACCESS_TOKEN', 'ddp_0Def0efeXK3Aj5y0i5VnixOr4Dsmge0UtLSk');
//     this.kv = kv;
//   }
//   // 添加新的漏洞记录
//   async addVulnerability(vuln: Vulnerability): Promise<void> {
//     console.log('入库:',vuln.domain)
//     await this.kv.set(['vulnerabilities',  vuln.domain,vuln.id], vuln);
//   }

//   // 获取特定的漏洞记录
//   async getVulnerability(id: string, domain: string): Promise<Vulnerability | null> {
//     const result = await this.kv.get<Vulnerability>(['vulnerabilities',  domain,id]);
//     return result.value;
//   }

//   // 获取所有漏洞记录
//   async getAllVulnerabilities(): Promise<Vulnerability[]> {
//     const vulnerabilities: Vulnerability[] = [];
//     for await (const entry of this.kv.list<Vulnerability>({ prefix: ['vulnerabilities'] })) {
//       vulnerabilities.push(entry.value);
//     }
//     return vulnerabilities;
//   }

//   // 更新漏洞记录
//   async updateVulnerability(vuln: Vulnerability): Promise<void> {
//     await this.kv.set(['vulnerabilities', vuln.id, vuln.domain], vuln);
//   }

//   // 删除漏洞记录
//   async deleteVulnerability(id: string, domain: string): Promise<void> {
//     await this.kv.delete(['vulnerabilities', id, domain]);
//   }

//   // 获取特定域名的所有漏洞
//   async getVulnerabilitiesByDomain(domain: string): Promise<Vulnerability[]> {
//     const vulnerabilities: Vulnerability[] = [];
//     for await (const entry of this.kv.list<Vulnerability>({ prefix: ['vulnerabilities', domain] })) {
//       vulnerabilities.push(entry.value);
//     }
//     return vulnerabilities;
//   }
// }

// 扫描任务数据库操作
// export class ScanTaskDB {
//   constructor(private kv: Deno.Kv) {
//     this.kv = kv;
//   }
//   // 添加新的扫描任务
//   async addScanTask(task: ScanTask): Promise<void> {
//     await this.kv.set(['scantasks', task.id], task);
//   }

//   // 获取特定的扫描任务
//   async getScanTask(id: string): Promise<ScanTask | null> {
//     const result = await this.kv.get<ScanTask>(['scantasks', id]);
//     return result.value;
//   }

//   // 获取所有扫描任务
//   async getAllScanTasks(): Promise<ScanTask[]> {
//     const tasks: ScanTask[] = [];
//     for await (const entry of this.kv.list<ScanTask>({ prefix: ['scantasks'] })) {
//       tasks.push(entry.value);
//     }
//     return tasks;
//   }

//   // 更新扫描任务状态
//   async updateScanTaskStatus(id: string, status: ScanTask['status'], endTime?: number): Promise<void> {
//     const task = await this.getScanTask(id);
//     if (task) {
//       task.status = status;
//       if (endTime) task.endTime = endTime;
//       await this.kv.set(['scantasks', id], task);
//     }
//   }

//   // 删除扫描任务
//   async deleteScanTask(id: string): Promise<void> {
//     await this.kv.delete(['scantasks', id]);
//   }
// }

export interface CrawlResult {
  id: string;
  url: string;
  content: string;
  links: string[];
  linkCount: number;
  status: "started" | "completed";
  timestamp: number;
  downloadCount?:number
}

export class CrawlerDB {
  

  constructor(private db:Deno.Kv) {
    
  }

  async saveResult(result: CrawlResult): Promise<void> {
    result.timestamp = Date.now();
    await this.db.set(['crawlers',result.url], result);
  }

  async getResult(url: string): Promise<CrawlResult | null> {
    return await this.db.get<CrawlResult>(['crawlers',url]) as any;
  }

  async getAllResults(): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    for await (const entry of this.db.list<CrawlResult>({ prefix: ['crawlers'] })) {
      results.push(entry.value);
    }
    return results;
  }

  async updateResult(update: Partial<CrawlResult> & { id: string }): Promise<void> {
    const existingResult = await this.getResult(update.id);
    if (!existingResult) {
      throw new Error(`Crawler result with id ${update.id} not found`);
    }

    const updatedResult: CrawlResult = {
      ...existingResult,
      ...update,
    };

    await this.db.set(['crawlers', update.id], updatedResult);
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}



// FILEPATH: e:/deno_mitm/core/crawler/crawler_item_db.ts



// export interface CrawlerItem {
//   id: string;
//   crawlerId: string;
//   url: string;
//   requestRaw: string;
//   responseRaw: string;
//   timestamp: number;
// }

// export class CrawlerItemDb {
//   private db: Database;

//   constructor(dbPath: string) {
//     this.db = new Database(dbPath);
//     // this.initTable();
//   }

//   private initTable() {
//     this.db.prepare(`
//       CREATE TABLE IF NOT EXISTS crawler_items (
//         id TEXT PRIMARY KEY,
//         crawler_id TEXT,
//         url TEXT,
//         request_raw TEXT,
//         response_raw TEXT,
//         timestamp INTEGER
//       )
//     `);
//   }

//   async addItem(item: CrawlerItem): Promise<void> {
//     const stmt = this.db.prepare(
//       "INSERT INTO crawler_items (id, crawler_id, url, request_raw, response_raw, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
//     );
//     stmt.run(item.id, item.crawlerId, item.url, item.requestRaw, item.responseRaw, item.timestamp);
//     stmt.finalize();
//   }

//   async getItem(id: string): Promise<CrawlerItem | null> {
//     const stmt = this.db.prepare(
//       "SELECT id, crawler_id, url, request_raw, response_raw, timestamp FROM crawler_items WHERE id = ?"
//     );
//     const result = stmt.all([id]);
//     stmt.finalize();

//     if (result.length === 0) {
//       return null;
//     }

//     const { itemId, crawlerId, url, requestRaw, responseRaw, timestamp } = result[0];
//     return { id: itemId, crawlerId, url, requestRaw, responseRaw, timestamp };
//   }

//   async getItemsByCrawlerId(crawlerId: string): Promise<CrawlerItem[]> {
//     const stmt = this.db.prepare(
//       "SELECT id, crawler_id, url, request_raw, response_raw, timestamp FROM crawler_items WHERE crawler_id = ?"
//     );
//     const results:CrawlerItem[] =await stmt.all(crawlerId) as any as CrawlerItem[];
//     stmt.finalize();

//     return results.map(({ id, crawlerId, url, requestRaw, responseRaw, timestamp }) => ({
//       id,
//       crawlerId,
//       url,
//       requestRaw,
//       responseRaw,
//       timestamp,
//     }));
//   }

//   async updateItem(item: CrawlerItem): Promise<void> {
//     const stmt = this.db.exec(
//       "UPDATE crawler_items SET url = ?, request_raw = ?, response_raw = ?, timestamp = ? WHERE id = ?",
//       item.url, item.requestRaw, item.responseRaw, item.timestamp, item.id
//     );
    
//   }

//   async deleteItem(id: string): Promise<void> {
//     const stmt = this.db.prepare("DELETE FROM crawler_items WHERE id = ?");
//     stmt.run(id);
//     stmt.finalize();
//   }

//   close() {
//     this.db.close();
//   }
// }

// const kv = await Deno.openKv('https://api.deno.com/databases/1039d482-52d1-40b0-85cd-70a4ac892d93/connect');


// export const scanTaskDB = new ScanTaskDB(kv);
// export const vulnerabilityDB = new VulnerabilityDB(kv);
// export const crawlerDB = new CrawlerDB(kv);
// export const crawlerItemDb = new CrawlerItemDb('a.db');

