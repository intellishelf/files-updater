import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
})

openai.beta.assistants
  .list()
  .then(r => r.data.forEach(async a => await openai.beta.assistants.del(a.id)))

openai.files
  .list()
  .then(r => r.data.forEach(async f => await openai.files.del(f.id)))
