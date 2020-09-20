import getCompletionItems from './completions';

export default {
  name: 'coc-toml completion source', // unique id
  shortcut: '[CS]', // [CS] is custom source
  priority: 1,
  triggerPatterns: [], // RegExp pattern
  doComplete: async () => {
    return await getCompletionItems();
  },
};
