import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database, Recipe, RecipeProject } from "types/database";
import { ProjectContainer } from "ui/components/Project/ProjectContainer";
import { fetchProjectPage } from "ui/fetchers/project";
export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: {
    project: string;
  };
}) {
  const supabase = createServerComponentClient<Database>({
    cookies,
  });

  const { project, recipes, projectName } = await fetchProjectPage({
    params,
    supabase,
  });

  return (
    <ProjectContainer
      projectName={projectName}
      project={project}
      recipes={recipes}
    />
  );
}