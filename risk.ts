/**
 * 请设置环境变量 `WEBHOOK_TOKEN` 来使用https://webhook.site  进行 http回显
 *
 * 该模块集成了  webhook和dnslog 用于探测ssrf
 *
 * @module
 */
// 配置参数（需要用户手动获取）
const WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN"); // 从 webhook.site 获取的唯一标识

async function newLocalReverseHTTPUrl(mod = "webhook.site") {
  let token = crypto.randomUUID();
  let response = await fetch(
    `https://webhook.site/token/${WEBHOOK_TOKEN}/requests/${token}`,
  );
  return { response, token };
}
async function haveReverseRisk(token: string) {
  if (!WEBHOOK_TOKEN) throw new Error("尚未配置环境变量 WEBHOOK_TOKEN");
  let url =
    `https://webhook.site/token/${WEBHOOK_TOKEN}/requests?sorting=newest&query=url:${token}`;
  console.log(url);
  let result = await (await fetch(
    url,
  )).json();
  console.log(result);
  return result;
}

function genReverseUrl(token: string) {
  return `https://${WEBHOOK_TOKEN}.webhook.site/${token}`;
}

export interface DNSLogResult {
  domain: string;
  token: string;
  error: Error | null;
}

export async function newDNSLogDomain(
  platform: string = "dnslog.cn",
): Promise<DNSLogResult> {
  switch (platform) {
    case "dnslog.cn":
      return await dnslogCn();
    // 可以在这里添加其他平台的支持
    default:
      return {
        domain: "",
        token: "",
        error: new Error(`Unsupported platform: ${platform}`),
      };
  }
}

export interface DNSLogRecord {
  domain: string;
  ip: string;
  timestamp: string;
}
/** dnslog cn 平台 */
async function dnslogCn(): Promise<DNSLogResult> {
  try {
    const baseUrl = "http://dnslog.cn";

    // 获取 session cookie
    const response = await fetch(baseUrl);
    const setCookie = response.headers.get("set-cookie");

    // 获取 domain
    const domainResponse = await fetch(
      `${baseUrl}/getdomain.php?t=0.6732314765575611`,
    );

    if (!domainResponse.ok) {
      throw new Error(`HTTP error! status: ${domainResponse.status}`);
    }
    const cookie = domainResponse.headers.get("set-cookie");

    const domain = await domainResponse.text();

    return {
      domain,
      token: cookie as string, // 使用 cookie 作为 token
      error: null,
    };
  } catch (error) {
    return {
      domain: "",
      token: "",
      error: error instanceof Error
        ? error
        : new Error("Unknown error occurred"),
    };
  }
}

/**根据token来获得dns记录 */
export  async function checkDNSLogByToken(
  token: string,
): Promise<DNSLogRecord[]> {
  try {
    const baseUrl = "http://dnslog.cn";
    const response = await fetch(`${baseUrl}/getrecords.php`, {
      headers: { "Cookie": token },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: string[][] = await response.json();

    const records: DNSLogRecord[] = data.map(([domain, ip, timestamp]) => ({
      domain,
      ip,
      timestamp,
    }));

    return records;
  } catch (error) {
    console.error("Error checking DNSLog:", error);
    return [];
  }
}

// export default {
//   checkDNSLogByToken,
//   dnslogCn,
//   newDNSLogDomain,
//   /**dasd */
//   newLocalReverseHTTPUrl,
//   haveReverseRisk,
//   genReverseUrl,
// };
