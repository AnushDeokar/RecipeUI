"use client";

import { useRecipeSessionStore } from "../../state/recipeSession";
import { Recipe, RecipeProject } from "types/database";
import { RecipeProjectStatus } from "types/enums";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useIsTauri } from "../../hooks/useIsTauri";

export function ProjectHome({
  project,
  recipes,
}: {
  project: RecipeProject;
  recipes: Recipe[];
}) {
  return (
    <div className="flex-1 px-4 pt-4">
      <div className="flex justify-start rounded-md border border-slate-200 dark:border-slate-600 min-h-[250px] bg-white dark:bg-slate-800">
        <div className="p-4 flex flex-col space-y-8 lg:space-y-0  justify-center  lg:flex-row lg:items-center lg:space-x-8">
          {project.image && (
            <img
              src={project.image}
              className="max-w-[10rem] rounded-lg"
              alt={project.title}
            />
          )}
          <div className="sm:ml-4">
            <h1 className="text-5xl font-bold">{project.title}</h1>
            <p className="py-4">{project.description}</p>
          </div>
        </div>
      </div>
      {recipes.length > 0 ? (
        <div className="projects-home-container">
          {recipes.map((recipe) => {
            return (
              <ProjectHomeBox
                key={recipe.id}
                recipe={recipe}
                project={project}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-96">
          <span className="text-3xl font-bold">No recipes yet.</span>
        </div>
      )}
    </div>
  );
}

function ProjectHomeBox({
  recipe,
  project,
}: {
  recipe: Recipe;
  project: RecipeProject;
}) {
  const router = useRouter();
  const addSession = useRecipeSessionStore((state) => state.addSession);
  const createdAt = new Date(recipe.created_at!);
  const currentTime = new Date();
  const difference = currentTime.getTime() - createdAt.getTime();
  const isTauri = useIsTauri();

  return (
    <div
      className={classNames(
        "border border-slate-700 rounded-md p-4 space-y-1 flex flex-col h-38 cursor-pointer recipe-container-box",
        difference < 300000 && "border-accent"
      )}
      onClick={() => {
        if (!isTauri) {
          router.push(`/a/${recipe.id}`);
        }
      }}
    >
      <div className="flex justify-between ">
        <div className="flex items-center">
          <h2 className="font-bold text-lg dark:text-gray-300">
            {recipe.title}
          </h2>
        </div>

        <button
          className={classNames(
            "btn btn-outline btn-sm",
            project.status === RecipeProjectStatus.Soon && "!btn-accent"
          )}
        >
          View
        </button>
      </div>
      <p className="text-sm text-black line-clamp-3 dark:text-gray-300">
        {recipe.summary}
      </p>
      {((recipe.tags && recipe.tags.length > 0) || difference < 300000) && (
        <>
          <div className="flex-1" />
          <div className="space-x-2">
            {recipe?.tags?.map((tag) => {
              return (
                <span
                  className="badge badge-info p-2 py-3"
                  key={recipe.id + tag}
                >
                  {tag}
                </span>
              );
            })}
            {difference < 300000 && (
              <span className="badge badge-accent font-bold py-2">New</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
