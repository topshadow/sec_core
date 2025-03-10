import { xhtml } from "./mod.ts";

Deno.test("xhtml",()=>{
    let ps= xhtml.found(`<html> <div> <h1>hello abc</h1> <script>let a='abc' </script> </div> </html>`,"abc");
    console.log(ps.map(p=>p.position).join('-'))
 })