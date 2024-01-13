import { InvocationContext } from '@azure/functions';
import { book_changed } from './src/functions/book_changed'
import OpenAI from "openai";
import { sleep } from 'openai/core';
const openai = new OpenAI();

async function main() {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Give me book name and author and try to detect language. Output your response on the language from cover in JSON format" },
          {
            type: "image_url",
            image_url: {
              "url": "https://d23tvywehq0xq.cloudfront.net/628442e5485b674ce063fd49d5a0ec9c83adc0f5.jpg",
            },
          },
        ],
      },
    ],
    "max_tokens": 300
  });
  console.log(response.choices);
}
main();