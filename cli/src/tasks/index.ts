import { CategoryDefinition } from "../types.js";
import auth from "./auth.js";

const categories: Record<string, CategoryDefinition> = {
  auth,
};

export function getCategory(name: string): CategoryDefinition | undefined {
  return categories[name];
}

export function listCategories(): string[] {
  return Object.keys(categories);
}

export default categories;
