import { checkDNSLogByToken, newDNSLogDomain } from './risk.ts';

Deno.test('webook test', async () => {
  let result = await (await fetch(
    `https://webhook.site/token/91432632-2c6d-4a84-b348-6fc61d583cda/requests?sorting=newest&query=url:qqqqqqqqq`,
  )).json();
  console.log(result);
});
// 配置参数（需要用户手动获取）
const WEBHOOK_TOKEN = Deno.env.get('WEBHOOK_TOKEN'); // 从 webhook.site 获取的唯一标识
// 生成 Webhook.site 监听地址
const WEBHOOK_URL = `https://webhook.site/${WEBHOOK_TOKEN}`;

const TARGET_URL = 'http://localhost:8787/ssrf/in-get'; // 存在SSRF漏洞的目标URL
const VULN_PARAM = 'url'; // 存在注入点的参数名

// 主检测函数
async function checkSSRF() {
  try {
    // 1. 构造恶意请求（GET示例，POST可修改为对应方法）
    const maliciousUrl = new URL(TARGET_URL);
    maliciousUrl.searchParams.set(VULN_PARAM, WEBHOOK_URL);

    // 2. 发送测试请求
    console.log(`[!] 正在发送测试请求到: ${maliciousUrl.href}`);
    const response = await fetch(maliciousUrl.href, {
      headers: { 'User-Agent': 'Deno/SSRF-Test' },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // 3. 等待服务器处理（建议5-10秒）
    console.log('[*] 等待服务端触发请求...');
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // 4. 检查 Webhook.site 记录
    const checkUrl = `https://webhook.site/token/${WEBHOOK_TOKEN}/requests`;
    const webhookRes = await fetch(checkUrl, {
      headers: { 'Accept': 'application/json' },
    });

    const { data } = await webhookRes.json() as { data: any[] };

    // 5. 结果判定
    if (data.length > 0) {
      const lastReq = data[0];
      console.log(`[+] SSRF漏洞确认！服务器IP: ${lastReq.ip}`);
      console.log(`    请求时间: ${lastReq.created_at}`);
      console.log(`    完整记录: https://webhook.site/#!/${WEBHOOK_TOKEN}`);
    } else {
      console.log('[-] 未检测到服务端出站请求');
    }
  } catch (error) {
    console.error('[!] 检测失败:', (error as Error).message);
  }
}

Deno.test('dnslog', async () => {
  await main();
});
// 使用示例
async function main() {
  const { domain, token, error } = await newDNSLogDomain();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Domain: ${domain}`);
        console.log(`Token: ${token}`);

        // 使用获得的 domain 和 token 进行 SSRF 测试
        const testSubdomain = `${domain}`;
        console.log(`Use this for SSRF testing: ${testSubdomain}`);
        try {
            let restext = await (await fetch(`http://${testSubdomain}`)).text();
            console.log(restext);
        } catch (e) {
        }

        let records = await checkDNSLogByToken(token);
        console.log(records)
    }
}

// 运行示例
