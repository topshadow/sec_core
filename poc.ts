import { dumpRequest } from "./http_util.ts";

export async function httpEx(
  request: Request,
): Promise<{ response: Response; duration: number }> {
  const startTime = performance.now();
  let raw = await dumpRequest(request.clone());
  console.log(raw);
  let response: Response;
  try {
    response = await fetch(request);
  } catch (error) {
    console.error("Error sending request:", error);
    throw error;
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  return {
    response,
    duration,
  };
}


