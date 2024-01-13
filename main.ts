import { InvocationContext } from '@azure/functions';
import { book_changed } from './src/functions/book_changed'


import OpenAI from "openai";
book_changed(
  [
    {
      id: '1',
      userId: 123,
      author: '123'
    }
  ],
  new InvocationContext()
);
