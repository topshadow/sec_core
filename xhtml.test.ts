import xhtml, { DetectionResult } from "./xhtml.ts";
Deno.test("xhtml", () => {
  let ps = xhtml.found(
    `<h1>hello KyQegJ</h1><script>let a='KyQegJ'</script>`,
    "KyQegJ",
  );
  console.log(ps.map((p) => p.position).join("-"));
});

Deno.test("test match between", async () => {
  const testCases = [
    {
      src: "Hello [world] Goodbye",
      start: "[",
      end: "]",
      n: -1,
      expected: [6, "world"],
    },
    {
      src: "Hello [world] Goodbye",
      start: "[",
      end: "]",
      n: 3,
      expected: [6, "wor"],
    },
    {
      src: "Hello [world Goodbye",
      start: "[",
      end: "]",
      n: -1,
      expected: [6, "world Goodbye"],
    },
    {
      src: "Hello [world Goodbye",
      start: "[",
      end: "]",
      n: 5,
      expected: [6, "world"],
    },
    {
      src: "Hello world Goodbye",
      start: "[",
      end: "]",
      n: -1,
      expected: [-1, ""],
    },
  ];

  testCases.forEach((testCase, index) => {
    const result = xhtml.matchBetween(
      testCase.src,
      testCase.start,
      testCase.end,
      testCase.n,
    );
    console.log(`Test case ${index + 1}:`);
    console.log(
      `Input: "${testCase.src}", start: "${testCase.start}", end: "${testCase.end}", n: ${testCase.n}`,
    );
    console.log(
      `Expected: [${testCase.expected[0]}, "${testCase.expected[1]}"]`,
    );
    console.log(`Actual: [${result[0]}, "${result[1]}"]`);
    console.log(
      `Result: ${
        JSON.stringify(result) === JSON.stringify(testCase.expected)
          ? "PASS"
          : "FAIL"
      }`,
    );
    console.log("---");
  });
});

Deno.test("test", () => {
  const htmlString = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>测试页面</title>
      </head>
      <body>
        <h1 id="main-title" class="header">欢迎</h1>
        <p>这是一个<strong>测试</strong>段落。</p>
        <div data-info="some-data">
          <ul>
            <li>项目 1</li>
            <li>项目 2</li>
          </ul>
        </div>
        <!-- 这是一个注释 -->
      </body>
      </html>
      `;

  console.log(xhtml.found(htmlString, "欢迎")); // StringPosition.TEXT
  console.log(xhtml.found(htmlString, "main-title")); // StringPosition.ATTRIBUTE
  console.log(xhtml.found(htmlString, "这是一个注释")); // StringPosition.COMMENT
  console.log(xhtml.found(htmlString, "不存在的字符串")); // StringPosition.NOT_FOUND
});

Deno.test("get id value", () => {
  let html =
    `<!doctype html>\n<html>\n<head>\n    <title>Example DEMO</title>\n\n    <meta charset="utf-8" />\n    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1" />\n    <style type="text/css">\n    body {\n        background-color: #f0f0f2;\n        margin: 0;\n        padding: 0;\n        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;\n        \n    }\n    div {\n        width: 600px;\n        margin: 5em auto;\n        padding: 2em;\n        background-color: #fdfdff;\n        border-radius: 0.5em;\n        box-shadow: 2px 3px 7px 2px rgba(0,0,0,0.02);\n    }\n    </style>    \n</head>\n\n<body>\n<div>\n\tHello Visitor!\n\t<br>\n\tHere are photo for U! <br>\n\t<img style='width: 100px' alt='"></IMG><img id='lxAwsNOy' src=1 onerror='prompt(1)'><imG IMG="' src="/static/logo.png" onclick='javascript:alert("Welcome CLICK ME!")'/>\n</div>\n</body>\n</html>`;
  console.log(xhtml.found(html, "lxAwsNOy"));
});
