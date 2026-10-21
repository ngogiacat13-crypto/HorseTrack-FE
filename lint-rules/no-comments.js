const ALLOWED = /^\s*(eslint-(disable|enable)|@ts-(ignore|expect-error|nocheck)|\/\s*<reference|@vite-ignore|[#@]__PURE__)/;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow comments in source code; name things clearly and put the reason in the commit message.' },
    schema: [],
    messages: { noComment: 'Không viết comment trong code (AGENTS.md). Đặt tên tự mô tả, ghi lý do vào commit message.' },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type === 'Shebang' || ALLOWED.test(comment.value)) continue;
          context.report({ loc: comment.loc, messageId: 'noComment' });
        }
      },
    };
  },
};
