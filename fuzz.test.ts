// fuzz.test.ts
import { assertEquals } from "https://deno.land/std@0.202.0/assert/mod.ts";
import { FuzzParamExtractor, type FuzzParam, type ParamType } from "./fuzz.ts";

// 定义测试参数类型简化版
type TestParam = Pick<FuzzParam, "position"> & Partial<FuzzParam>;

// 测试用例类型
type TestCase = {
  name: string;
  params: TestParam[];
  expected: TestParam[];
};

// 公共测试用例集合
const TEST_CASES: TestCase[] = [
  {
    name: "空参数列表",
    params: [],
    expected: []
  },
  {
    name: "仅包含 header 参数",
    params: [{ position: "header" }],
    expected: []
  },
  {
    name: "包含混合参数类型",
    params: [
      { position: "header" },
      { position: "query", name: "q" },
      { position: "cookie" },
      { position: "form", name: "username" }
    ],
    expected: [
      { position: "query", name: "q" },
      { position: "form", name: "username" }
    ]
  },
  {
    name: "所有可模糊参数类型",
    params: [
      { position: "query" },
      { position: "form" },
      { position: "json" },
      { position: "path" },
      { position: "file" }
    ],
    expected: [
      { position: "query" },
      { position: "form" },
      { position: "json" },
      { position: "path" },
      { position: "file" }
    ]
  }
];

Deno.test("FuzzParamExtractor.getAllFuzzableParams", async (t) => {
  // 创建测试上下文
  const ctx = new FuzzParamExtractor(new Request("http://example.com",{
    method: "GET",
    
    headers: {}
  }));

  // 遍历测试用例
  for (const tc of TEST_CASES) {
    await t.step(tc.name, () => {
      // 注入测试参数（通过类型断言保持兼容性）
      ctx["params"] = tc.params as FuzzParam[];

      // 执行测试并验证结果
      const actual = ctx.getAllFuzzableParams();
      assertEquals(
        actual.map(p => ({ position: p.position, name: p.name })),
        tc.expected.map(p => ({ position: p.position, name: p.name })),
        `测试失败: ${tc.name}`
      );
    });
  }
});

// const ctx = new FuzzParamExtractor(new Request("http://example.com",{
//     method: "GET",
    
//     headers: {}
//   }));

//   // 遍历测试用例
//   for (const tc of TEST_CASES) {
    
//       // 注入测试参数（通过类型断言保持兼容性）
//       ctx["params"] = tc.params as FuzzParam[];

//       // 执行测试并验证结果
//       const actual = ctx.getAllFuzzableParams();
//       console.log(actual)
//     //   assertEquals(
//     //     actual.map(p => ({ position: p.position, name: p.name })),
//     //     tc.expected.map(p => ({ position: p.position, name: p.name })),
//     //     `测试失败: ${tc.name}`
//     //   );
  
//   }