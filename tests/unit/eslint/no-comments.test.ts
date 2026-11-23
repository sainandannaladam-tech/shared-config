import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { noCommentsRule } from "../../../src/eslint/no-comments.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
});
const oneComment = [{ messageId: "noComment" }];

ruleTester.run("no-comments", noCommentsRule, {
  valid: [
    "const answer = 42;",
    "#!/usr/bin/env node\nconst answer = 42;",
    'const text = "// this is text, not a comment";',
    "const pattern = /\\/\\*.*\\*\\//;",
  ],
  invalid: [
    { code: "// a line comment\nconst answer = 42;", errors: oneComment },
    { code: "/* a block comment */ const answer = 42;", errors: oneComment },
    {
      code: "/** a documentation comment */\nexport const answer = 42;",
      errors: oneComment,
    },
    {
      code: "// @ts-ignore\nconst answer: number = 42;",
      errors: oneComment,
    },
    {
      code: '/// <reference types="node" />\nconst answer = 42;',
      errors: oneComment,
    },
    {
      code: "#!/usr/bin/env node\n// after the interpreter line\nconst answer = 42;",
      errors: oneComment,
    },
    {
      code: "const answer = 42; // at the end of a line\n// and another",
      errors: [{ messageId: "noComment" }, { messageId: "noComment" }],
    },
  ],
});
