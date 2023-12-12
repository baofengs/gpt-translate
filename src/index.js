import { ChatGPTApi } from './common/openai.js';
import { Prompt } from './common/constant.js';

export async function translate(text) {
  const gpt = new ChatGPTApi();
  gpt.chat({
    data: {
      question: Prompt + text,
    },
    onFinish: () => {
      console.log('\n');
    },
    onUpdate: (text, delta) => {
      process.stdout.write(delta);
    },
  });
}
