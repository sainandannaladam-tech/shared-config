import type { Rule } from "eslint";

const interpreterLine = "#!";

export const noCommentsRule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow comments: the reason for code goes in the design doc, the pull request or the commit message",
    },
    schema: [],
    messages: {
      noComment:
        "Comments are not allowed. Explain the code with names and types; put the reason in the design doc, the pull request or the commit message.",
    },
  },
  create(context) {
    const { sourceCode } = context;
    const startsWithInterpreterLine =
      sourceCode.text.startsWith(interpreterLine);
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          const isInterpreterLine =
            startsWithInterpreterLine && comment.range?.[0] === 0;
          if (!isInterpreterLine) {
            context.report({
              loc: comment.loc ?? { line: 1, column: 0 },
              messageId: "noComment",
            });
          }
        }
      },
    };
  },
};
