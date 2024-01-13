import { InvocationContext } from '@azure/functions';
import { book_changed } from './src/functions/book_changed'
import OpenAI from "openai";
import { sleep } from 'openai/core';

const openai = new OpenAI();

async function main() {

  const thread = await openai.beta.threads.create();

  const message = await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: "запропонуй книжку",
      file_ids: ["file-n05mDcv4jncvomKMTEGRqD2J"]
    }
  );

  const run = await openai.beta.threads.runs.create(
    thread.id,
    { 
      assistant_id: "asst_v9hSERcXNtHBOmBepsPBg085"
    }
  );

  while(true)
  {
    const existingRun = await openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );

    if(existingRun.status == 'completed'){
      console.log('break')
      break;
    }else{
      console.log('sleep')
      await sleep(3000);
    }
  }

  const messages = await openai.beta.threads.messages.list(
    thread.id
  );

  console.log(messages.data.forEach(v => console.log(v.content)));

  await openai.beta.threads.del(thread.id);

}

main();

