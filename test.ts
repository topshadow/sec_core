// FILEPATH: e:/deno_mitm/core/core/test.ts

// 生成一段 HTML
const generateHTML = () => {
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sample HTML Page</title>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { width: 80%; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          p { margin-bottom: 10px; }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>Welcome to Our Sample Page</h1>
          <p>This is a paragraph of text. It contains some sample content to demonstrate the structure of an HTML page.</p>
          <p>Here's another paragraph with some more text. This helps to show how multiple paragraphs are formatted.</p>
          <ul>
              <li>This is the first item in an unordered list.</li>
              <li>Here's the second item in the list.</li>
              <li>And this is the third and final item.</li>
          </ul>
      </div>
  </body>
  </html>
    `;
  };
  
  // 使用 Brotli 进行压缩并比较大小
  const compareSize = async (html: string) => {
    const encoder = new TextEncoder();
    const originalData = encoder.encode(html);
    const compressedData = await Deno.compress(originalData, {
      level: 11, // 最高压缩级别
    });
  
    const originalSize = originalData.length;
    const compressedSize = compressedData.length;
  
    console.log(`Original size: ${originalSize} bytes`);
    console.log(`Compressed size: ${compressedSize} bytes`);
  
    const compressionRatio = (compressedSize / originalSize) * 100;
    console.log(`Compression ratio: ${compressionRatio.toFixed(2)}%`);
  
    // 验证解压缩
    const decompressedData = await Deno.decompress(compressedData);
    const decoder = new TextDecoder();
    const decompressedHtml = decoder.decode(decompressedData);
    console.log(`Decompression successful: ${decompressedHtml === html}`);
  };
  
  // 执行比较
  const html = generateHTML();
  await compareSize(html);
  