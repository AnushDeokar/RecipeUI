import fs from "fs";
import { mkdirp } from "mkdirp";
import { RecipeProject, Recipe } from "types/database";
import { findFilesInDir, restrictObjectsAndArrays } from "./utils";
import "./minify";

let collections: (RecipeProject & {
  rank?: number;
})[] = [];
findFilesInDir(
  "./core",
  "collection.json",
  (filePath) => {
    const content = fs.readFileSync(filePath, "utf8");

    const jsonContent = JSON.parse(content.trim());
    collections.push(jsonContent);
  },
  () => {
    const outputPathForCollections = "./build/core";

    // If rank field, sort higher rank first. Rank is higher than no rank
    collections.sort((a, b) => {
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      } else if (a.rank) {
        return -1;
      } else if (b.rank) {
        return 1;
      } else {
        return 0;
      }
    });

    try {
      mkdirp.sync(outputPathForCollections);
    } catch (e) {}
    fs.writeFileSync(
      `${outputPathForCollections}/collections.json`,
      JSON.stringify(collections),
      "utf8"
    );
  }
);

let apiRecipes: Recipe[] = [];
findFilesInDir(
  "./core",
  "api.json",
  (filePath) => {
    const apiContent = fs.readFileSync(filePath, "utf8");
    const apiJsonContent = JSON.parse(apiContent.trim()) as Recipe;
    let recipes: null | any = null;

    try {
      let recipeContent = fs.readFileSync(
        filePath.replace("api.json", "recipes.json"),
        "utf8"
      );
      recipes = JSON.parse(recipeContent.trim());
    } catch (e) {
      console.log("No recipes found for API:", filePath);
    }

    apiJsonContent.templates = recipes;

    apiRecipes.push(apiJsonContent);
  },
  () => {
    const outputPathForFolder = `./build/core`;

    try {
      mkdirp.sync(outputPathForFolder);
    } catch (e) {}
    fs.writeFileSync(
      `${outputPathForFolder}/apis.json`,
      JSON.stringify(apiRecipes),
      "utf8"
    );
  }
);