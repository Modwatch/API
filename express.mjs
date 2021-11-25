import { ApolloServer, gql } from 'apollo-server';
import { resolve } from 'path';
import { read, readFile } from 'fs';
import { promisify } from 'util';

const readFileAsync = promisify(readFile);

(async () => {
  const schema = await readFileAsync(await import.meta.resolve('@modwatch/types/index.graphql'));
  console.log(schema);
})();
