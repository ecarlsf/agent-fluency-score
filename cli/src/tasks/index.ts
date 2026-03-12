import { CategoryDefinition } from "../types.js";
import auth from "./auth.js";
import orm from "./orm.js";

const categories: Record<string, CategoryDefinition> = {
  auth,
  orm,
};

export function getCategory(name: string): CategoryDefinition | undefined {
  return categories[name];
}

export function listCategories(): string[] {
  return Object.keys(categories);
}

export default categories;
