import { app, InvocationContext } from "@azure/functions";

export async function book_changed(documents: unknown[], context: InvocationContext): Promise<void> {
    context.log(`Cosmos DB function processed ${documents.length} documents`);
    context.log(documents[0]);
}

app.cosmosDB('book_changed', {
    connectionStringSetting: 'intellitest_DOCUMENTDB',
    databaseName: 'MyDb',
    collectionName: 'Books',
    createLeaseCollectionIfNotExists: true,
    handler: book_changed
});
