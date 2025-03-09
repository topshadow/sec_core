import { ScanTaskDB, VulnerabilityDB } from './db.ts';
const kv = await Deno.openKv('https://api.deno.com/databases/1039d482-52d1-40b0-85cd-70a4ac892d93/connect');

Deno.test('测试漏洞数据库操作', async () => {
    // Deno.env.set('DENO_KV_ACCESS_TOKEN','ddp_0Def0efeXK3Aj5y0i5VnixOr4Dsmge0UtLSk')
  
    // 初始化 Deno KV
    // const kv = await Deno.openKv("https://api.deno.com/databases/1039d482-52d1-40b0-85cd-70a4ac892d93/connect");
    // 初始化 Deno KV
  
    // 使用示例
    const vulnDB = new VulnerabilityDB(kv);
    const taskDB = new ScanTaskDB(kv);
  
    // 添加一个漏洞记录
    await vulnDB.addVulnerability({
      id: crypto.randomUUID(),
      url: 'https://example.com/vulnerable-page',
      domain: 'example.com', // 新增 domain 字段
      type: 'XSS',
      severity: 'high',
      description: 'Reflected XSS in search parameter',
      payload: "<script>alert('XSS')</script>",
      timestamp: Date.now(),
    });
  
    // 添加一个扫描任务
    await taskDB.addScanTask({
      id: crypto.randomUUID(),
      target: 'https://example.com',
      status: 'pending',
      startTime: Date.now(),
    });
  
    // 获取所有漏洞
    const allVulns = await vulnDB.getAllVulnerabilities();
    console.log(allVulns);
  
    // 获取所有扫描任务
    const allTasks = await taskDB.getAllScanTasks();
    console.log(allTasks);
  
    // 获取特定域名的所有漏洞
    const domainVulns = await vulnDB.getVulnerabilitiesByDomain('example.com');
    console.log(domainVulns);
  });
  