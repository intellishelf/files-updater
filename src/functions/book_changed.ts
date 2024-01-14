import { app, InvocationContext } from '@azure/functions'
import { CosmosClient } from '@azure/cosmos'
import OpenAI from 'openai'
import * as fs from 'fs'

const databaseId = 'MyDb'
const containerId = 'Books'

const client = new CosmosClient(
'')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY // This is the default and can be omitted
})

interface Book {
  id: string
  userId: number
  author: string
}
interface User {
  id: string
  userName: string
  openai: OpenaiData
}

interface OpenaiData {
  fileId: string
  assistantId: string
}

export async function book_changed (
  documents: Book[],
  context: InvocationContext
): Promise<void> {
  try {
    const container = client.database(databaseId).container(containerId)

    const usersContainer = client
      .database(databaseId)
      .container('BooksContrainer')

    const querySpec = {
      query:
        'SELECT c.id, c.userId, c.title, c.author, c.image FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: documents[0].userId }]
    }

    const usersQuerySpec = {
      query: 'SELECT c.id, c.userName, c.openai FROM c WHERE c.id = @userId',
      parameters: [{ name: '@userId', value: documents[0].userId.toString() }]
    }
    const { resources: books } = await container.items
      .query<Book>(querySpec)
      .fetchAll()

    const { resources: users } = await usersContainer.items
      .query<User>(usersQuerySpec)
      .fetchAll()

    let user = users[0]

    context.info(user)

    fs.writeFileSync(
      './user-' + user.id + '.json',
      ',' + JSON.stringify(books),
      {
        encoding: 'utf8'
      }
    )

    var file = await openai.files.create({
      file: fs.createReadStream('./user-' + user.id + '.json'),
      purpose: 'assistants'
    })

    context.info(file)

    if (user?.openai?.assistantId) {
      //update assistant file
      const existingAsstant = await openai.beta.assistants.retrieve(
        user.openai.assistantId
      )

      context.info(existingAsstant)

      existingAsstant.file_ids.forEach(async fileId => {
        await openai.files.del(fileId)
      })

      await openai.beta.assistants.update(existingAsstant.id, {
        description: existingAsstant.description ?? '',
        file_ids: [file.id],
        instructions: existingAsstant.instructions,
        metadata: existingAsstant.metadata,
        model: existingAsstant.model,
        name: existingAsstant.name
      })

      user.openai.fileId = file.id
    } else {
      let assistant = await openai.beta.assistants.create({
        name: 'Chatbot for Digital books library',
        instructions:
          'You are a chat bot which has access to user books catalog stored in file attached. You can answer question on books listed there on user language, provide information on books and authors you know, provide recommendations etc. When answering questions, take into account the file attached',
        model: 'gpt-4-1106-preview',
        tools: [{ type: 'retrieval' }],
        description: 'Chatbot for Digital books library',
        file_ids: [file.id]
      })

      user.openai = {
        fileId: file.id,
        assistantId: assistant.id
      }

      context.info(assistant)
    }

    await usersContainer.item(user.id).replace<User>(user)

    context.info(user)
  } catch (ex) {
    context.error(ex)
  }
}

app.cosmosDB('book_changed', {
  connectionStringSetting: 'intellitest_DOCUMENTDB',
  databaseName: 'MyDb',
  collectionName: 'Books',
  createLeaseCollectionIfNotExists: true,
  handler: book_changed
})
