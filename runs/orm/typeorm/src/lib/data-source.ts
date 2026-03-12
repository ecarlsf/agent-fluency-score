import "reflect-metadata";
import { DataSource, ObjectLiteral, Repository } from "typeorm";
import { Organization } from "./entities/Organization";
import { User } from "./entities/User";
import { Project } from "./entities/Project";
import { Task } from "./entities/Task";

function createDataSource() {
  return new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Organization, User, Project, Task],
    synchronize: true,
    logging: false,
  });
}

// Cache the initialized promise on globalThis to survive HMR in development
const globalForTypeorm = globalThis as typeof globalThis & {
  __typeormInit?: Promise<DataSource>;
};

export function getDb(): Promise<DataSource> {
  if (!globalForTypeorm.__typeormInit) {
    globalForTypeorm.__typeormInit = createDataSource().initialize();
  }
  return globalForTypeorm.__typeormInit;
}

/**
 * Resolve a repository by table name through the DataSource's own metadata.
 * This avoids class-identity mismatches caused by webpack duplicating entity
 * modules across chunks.
 */
export async function getRepo<T extends ObjectLiteral>(tableName: string): Promise<Repository<T>> {
  const ds = await getDb();
  const meta = ds.entityMetadatas.find((m) => m.tableName === tableName);
  if (!meta) throw new Error(`Entity with table "${tableName}" not found`);
  return ds.getRepository<T>(meta.target);
}
