import { useCallback, useContext, useState } from "react";
import {
  DesktopPage,
  RecipeBodyRoute,
  RecipeContext,
  RecipeOutputTab,
  RecipeProjectContext,
  useRecipeSessionStore,
} from "../../../state/recipeSession";
import { RecipeTemplate, UserTemplatePreview } from "types/database";
import { getTemplate } from "../actions";
import { useRouter, useSearchParams } from "next/navigation";
import classNames from "classnames";

import { usePostHog } from "posthog-js/react";
import { POST_HOG_CONSTANTS } from "../../../utils/constants/posthog";
import { Dialog } from "@headlessui/react";
import {
  DB_FUNC_ERRORS,
  FORM_LINKS,
  RECIPE_FORKING_ID,
  UNIQUE_ELEMENT_IDS,
} from "../../../utils/constants/main";
import { useLocalStorage, useSessionStorage } from "usehooks-ts";
import Link from "next/link";
import { ProjectScope, QueryKey } from "types/enums";
import { cloneTemplate, deleteTemplate } from "../RecipeBodySearch/actions";
import { useQueryClient } from "@tanstack/react-query";
import { useIsTauri } from "../../../hooks/useIsTauri";
import { useSupabaseClient } from "../../Providers/SupabaseProvider";
import {
  EllipsisHorizontalCircleIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { useSecret } from "../../../state/apiSession";
import { RecipeTemplateEdit } from "./RecipeTemplateEdit";

export function RecipeTemplatesTab() {
  const editorMode = useRecipeSessionStore((state) => state.editorMode);

  if (editorMode) {
    return <RecipeTemplateEdit />;
  }

  return (
    <div className="flex-1 relative">
      <div className="sm:absolute inset-0 mx-4 my-6 overflow-y-auto space-y-8">
        <UserTemplates />
        <StarterTemplates />
      </div>
    </div>
  );
}

const AuthBlock = `You need to setup authentication. Consider the mock option or setting up auth in the Config tab.`;
export function StarterTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;
  const templates = selectedRecipe.templates || [];

  if (templates.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">Community Recipes</h1>
      <p className="mt-2">Use the example below to see how to use this API.</p>
      <div className="flex-1 flex flex-col sm:grid grid-cols-2 gap-4 mt-4">
        {templates.map((template) => (
          <StarterTemplateItem key={template.title} template={template} />
        ))}
      </div>
    </div>
  );
}

function StarterTemplateItem({ template }: { template: RecipeTemplate }) {
  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const selectedRecipe = useContext(RecipeContext)!;
  const posthog = usePostHog();

  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);
  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);

  const setTemplate = async () => {
    const templateInfo = template;

    if (templateInfo.requestBody) {
      setRequestBody(templateInfo.requestBody);
    }

    if (templateInfo.queryParams) {
      setQueryParams(templateInfo.queryParams);
    }

    if (templateInfo.urlParams) {
      setUrlParams(templateInfo.urlParams);
    }

    setCurrentTab(RecipeOutputTab.Docs);
    setBodyRoute(RecipeBodyRoute.Parameters);
  };

  const secretInfo = useSecret(template.recipe?.id);

  const isTauri = useIsTauri();
  const [_, setRecipeFork] = useSessionStorage(RECIPE_FORKING_ID, "");
  const setDesktopPage = useRecipeSessionStore((state) => state.setDesktopPage);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  return (
    <div
      className="border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default"
      key={`${template.title}`}
    >
      <h3 className="font-bold">{template.title}</h3>
      <p className="text-sm line-clamp-3">{template.description}</p>
      <div className="flex-1" />
      <div className="flex space-x-2">
        <button
          className={classNames(
            "btn btn-sm btn-neutral w-fit",
            loadingTemplate && "btn-disabled"
          )}
          onClick={async () => {
            posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW, {
              template_id: "Core" + template.title,
              template_project: selectedRecipe.project,
              recipe_id: selectedRecipe.id,
              recipe_path: selectedRecipe.path,
            });
            setLoadingTemplate(template);
          }}
        >
          Simulate
        </button>
        <button
          className={classNames(
            "btn btn-sm btn-neutral",
            (loadingTemplate || loading) && "btn-disabled"
          )}
          onClick={async () => {
            // If this is desktop, then we just fork directly, if this is web then we redirect them to the fork tab

            if (isTauri) {
              try {
                setLoading(true);

                setRecipeFork(`${selectedRecipe.id}::${template.title}`);

                if (isTauri) {
                  setDesktopPage({
                    page: DesktopPage.Editor,
                  });
                } else {
                  router.push(`/editor`);
                }
              } catch (e) {}
              setLoading(false);
            } else {
              setBodyRoute(RecipeBodyRoute.Fork);
            }
          }}
        >
          Fork{" "}
          {loading && <span className="loading loading-bars loading-sm"></span>}
        </button>
      </div>
    </div>
  );
}

export function UserTemplates() {
  const selectedRecipe = useContext(RecipeContext)!;
  const searchParams = useSearchParams();
  const newTemplateId = searchParams.get("newTemplateId");

  const [forkedTemplate, setForkedTemplate] =
    useLocalStorage<UserTemplatePreview | null>(
      UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
      null
    );

  const userTemplates = [
    ...(forkedTemplate && forkedTemplate.recipe.id === selectedRecipe.id
      ? [forkedTemplate]
      : []),
    ...(selectedRecipe.userTemplates || []),
  ];

  const loadingTemplate = useRecipeSessionStore(
    (state) => state.loadingTemplate
  );

  const project = useContext(RecipeProjectContext)!;

  const isTeam = project.scope === ProjectScope.Team;

  if (userTemplates.length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold">
        {isTeam ? (
          <>
            <span className="">{`${project.title}'s`}</span> recipes
          </>
        ) : (
          "Your Recipes"
        )}
      </h1>
      <div className="flex-1 flex flex-col sm:grid grid-cols-2 gap-4 mt-4">
        {userTemplates.map((template) => (
          <UserTemplateItem
            key={template.title}
            template={template}
            isLocalFork={forkedTemplate?.id === template.id}
            setForkedTemplate={setForkedTemplate}
            newTemplateId={newTemplateId}
            loadingTemplate={loadingTemplate as RecipeTemplate}
            isTeam={isTeam}
          />
        ))}
      </div>
    </div>
  );
}

function UserTemplateItem({
  template,
  isLocalFork,
  newTemplateId,
  loadingTemplate,
  setForkedTemplate,
  isTeam,
}: {
  template: UserTemplatePreview;
  isLocalFork: boolean;
  newTemplateId: string | null;
  loadingTemplate: RecipeTemplate | null;
  setForkedTemplate: (template: UserTemplatePreview | null) => void;
  isTeam: boolean;
}) {
  const selectedRecipe = useContext(RecipeContext)!;
  const user = useRecipeSessionStore((state) => state.user);
  const posthog = usePostHog();
  const setBodyRoute = useRecipeSessionStore((state) => state.setBodyRoute);
  const setRequestBody = useRecipeSessionStore((state) => state.setRequestBody);
  const setQueryParams = useRecipeSessionStore((state) => state.setQueryParams);
  const setUrlParams = useRecipeSessionStore((state) => state.setUrlParams);

  const setCurrentTab = useRecipeSessionStore((state) => state.setOutputTab);
  const setLoadingTemplate = useRecipeSessionStore(
    (state) => state.setLoadingTemplate
  );
  const router = useRouter();

  const queryClient = useQueryClient();
  const isTauri = useIsTauri();
  const currentSession = useRecipeSessionStore((state) => state.currentSession);
  const supabase = useSupabaseClient();

  const setTemplate = async () => {
    const templateInfo = await getTemplate(template.id, supabase);

    if (!templateInfo) {
      alert("Failed to find template");
      return;
    }

    if (templateInfo.requestBody) {
      setRequestBody(templateInfo.requestBody);
    }

    if (templateInfo.queryParams) {
      setQueryParams(templateInfo.queryParams);
    }

    if (templateInfo.urlParams) {
      setUrlParams(templateInfo.urlParams);
    }

    setCurrentTab(RecipeOutputTab.Docs);
    setBodyRoute(RecipeBodyRoute.Parameters);
  };

  const secret = useSecret(template.recipe?.id);

  return (
    <div
      className={classNames(
        "border rounded-sm p-4 space-y-2 flex flex-col recipe-container-box !cursor-default relative",
        newTemplateId === String(template.id) &&
          "!border-accent !border-4 border-dashed "
      )}
      key={`${template.id}`}
    >
      <div className="absolute top-2 right-2 mr-1 dropdown dropdown-left  sm:inline-block cursor-pointer">
        <label
          tabIndex={0}
          className={classNames(loadingTemplate && "btn-disabled")}
        >
          <EllipsisHorizontalIcon className="w-6 h-6" />
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content  menu  shadow rounded-box  mt-1 grid  overflow-auto bg-base-100 text-xs r-0 top-5"
        >
          <li>
            <button
              className=""
              onClick={async () => {
                await setTemplate();

                posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_PREVIEW, {
                  template_id: template.id,
                  template_project: selectedRecipe.project,
                  recipe_id: selectedRecipe.id,
                  recipe_path: selectedRecipe.path,
                });
              }}
            >
              PREFILL
            </button>
          </li>
          <li>
            <button
              className={classNames()}
              onClick={async () => {
                posthog?.capture(POST_HOG_CONSTANTS.SHARED_TEMPLATE_PREVIEW, {
                  template_id: template.id,
                  template_project: selectedRecipe.project,
                  recipe_id: selectedRecipe.id,
                  recipe_path: selectedRecipe.path,
                });

                const templateInfo = await getTemplate(template.id, supabase);
                if (templateInfo) {
                  setLoadingTemplate(templateInfo);
                } else {
                  alert("Failed to find template");
                }
              }}
            >
              Simulate
            </button>
          </li>

          <li>
            <ShareRecipeButton template={template} />
          </li>
          {(template.original_author.user_id === user?.user_id ||
            template.author_id === user?.user_id) && (
            <li>
              <button
                className=""
                onClick={async () => {
                  if (
                    !(await confirm("Are you sure you want to delete this?"))
                  ) {
                    return;
                  }
                  if (isLocalFork) {
                    setForkedTemplate(null);
                    return;
                  }

                  const deletedTemplateRes = await deleteTemplate(
                    template.id,
                    supabase
                  );

                  if (deletedTemplateRes) {
                    posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_DELETE, {
                      template_id: template.id,
                      template_project: selectedRecipe.project,
                      recipe_id: selectedRecipe.id,
                      recipe_path: selectedRecipe.path,
                    });

                    if (isTauri) {
                      setTimeout(() => {
                        queryClient.invalidateQueries({
                          queryKey: [QueryKey.RecipesHomeView],
                        });
                      }, 0);
                    } else {
                      router.refresh();
                    }

                    alert("Recipe deleted");
                    return;
                  }
                }}
              >
                DELETE
              </button>
            </li>
          )}
        </ul>
      </div>
      {!isTeam ? (
        <>
          {(!user || template.original_author.user_id !== user.user_id) && (
            <Link
              className="text-xs"
              href={`/u/${template.original_author.username}`}
              target="_blank"
            >
              Forked from @{template.original_author.username}
            </Link>
          )}
        </>
      ) : (
        <>
          <Link
            className="text-xs"
            href={`/u/${template.original_author.username}`}
            target="_blank"
          >
            @{template.original_author.username}
          </Link>
        </>
      )}
      <h3 className="font-bold">{template.title}</h3>
      <p className="text-sm line-clamp-3">{template.description}</p>

      <div className="flex-1" />
      <div className="flex space-x-1  sm:block sm:space-x-2">
        <button
          className={classNames(
            "btn btn-sm btn-neutral",
            loadingTemplate && "btn-disabled"
          )}
          onClick={async () => {
            if (secret && selectedRecipe.auth != null) {
              alert(AuthBlock);
              return;
            }

            await setTemplate();

            posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_QUICK_USE, {
              template_id: template.id,
              template_project: selectedRecipe.project,
              recipe_id: selectedRecipe.id,
              recipe_path: selectedRecipe.path,
            });

            // setIsSending(true, RecipeOutputTab.Docs);
            setTimeout(() => {
              document
                .getElementById(UNIQUE_ELEMENT_IDS.RECIPE_SEARCH)
                ?.click();
            }, 500);
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ShareRecipeButton({ template }: { template: UserTemplatePreview }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className=""
        onClick={() => {
          setShowModal(true);
        }}
      >
        SHARE
      </button>
      {showModal && (
        <ShareModal
          template={template}
          onClose={() => {
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function ShareModal({
  template,
  onClose,
}: {
  template: UserTemplatePreview;
  onClose: () => void;
}) {
  const [onAction, setOnAction] = useState(false);
  const posthog = usePostHog();
  const isTauri = useIsTauri();
  const project = useContext(RecipeProjectContext);

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
          <TemplateMockCode template={template} />

          <button
            className="btn btn-accent w-full mt-4"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${isTauri ? "https://recipeui.com" : location.origin}/r/${
                  template.alias
                }`
              );

              posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
                template_id: template.id,
                template_project: template.recipe.project,
                recipe_title: template.recipe.title,
              });
              setOnAction(true);
            }}
          >
            {onAction ? "Copied to clipboard" : "Share"}
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function ShareInviteModal({
  template,
  onClose,
}: {
  template: UserTemplatePreview;
  onClose: () => void;
}) {
  const [isForking, setIsForking] = useState(false);
  const posthog = usePostHog();
  const user = useRecipeSessionStore((state) => state.user);

  const [newTemplateId, setNewTemplateId] = useState<string | null>(null);
  const [limitedForks, setLimitedForks] = useState(false);

  const [_, setForkedTemplate] = useLocalStorage<UserTemplatePreview | null>(
    UNIQUE_ELEMENT_IDS.FORK_REGISTER_ID,
    null
  );

  const isCurrentUserTemplate = template.author_id === user?.user_id;
  const isTauri = useIsTauri();
  const supabase = useSupabaseClient();

  const isTeam = template.project_scope === ProjectScope.Team;

  const isQuickUse = isCurrentUserTemplate || isTeam;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-20">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      <div className="fixed inset-0 z-10  flex items-center justify-center p-4">
        <Dialog.Panel className="bg-base-100 p-8 rounded-lg w-[400px]">
          <TemplateMockCode template={template} isTeam />
          {newTemplateId === null ? (
            <>
              {isCurrentUserTemplate && (
                <button
                  className="btn btn-accent w-full mt-4"
                  onClick={async () => {
                    await navigator.clipboard.writeText(
                      `${
                        isTauri ? "https://recipeui.com" : location.origin
                      }/r/${template.alias}`
                    );

                    alert("Copied to clipboard");
                  }}
                >
                  Share
                </button>
              )}
              <button
                className="btn btn-accent w-full mt-4"
                onClick={async (e) => {
                  if (isQuickUse) {
                    setNewTemplateId(template.id);
                    return;
                  }

                  if (!user) {
                    posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_TO_SHARE, {
                      template_id: template.id,
                      template_project: template.recipe.project,
                      recipe_title: template.recipe.title,
                    });

                    setForkedTemplate(template);
                    setNewTemplateId(template.id);
                  } else {
                    setIsForking(true);
                    const { newTemplate, error } = await cloneTemplate(
                      template.id,
                      supabase
                    );

                    if (newTemplate) {
                      posthog?.capture(POST_HOG_CONSTANTS.TEMPLATE_FORKED, {
                        new_template_id: newTemplate.id,
                        old_template_id: template.id,
                        template_project: template.recipe.project,
                        recipe_title: template.recipe.title,
                      });

                      setNewTemplateId(newTemplate.id);
                    } else if (
                      error === DB_FUNC_ERRORS.TEMPLATE_LIMIT_REACHED
                    ) {
                      setLimitedForks(true);
                    }
                    setIsForking(false);
                  }
                }}
              >
                {isQuickUse ? "Use template" : "Fork this Recipe!"}
                {isForking && <span className="loading loading-bars" />}
              </button>
            </>
          ) : null}

          {limitedForks && (
            <div className="alert alert-error !mt-4 flex flex-col items-start">
              <p>{`We love that you're making so many recipes but we're currently limiting users to 10 recipes right now to scale properly. Please delete some recipes and try again.`}</p>
              <p>Want to be an early RecipeUI power user?</p>
              <a
                href={FORM_LINKS.RECIPEUI_PRO}
                target="_blank"
                className="underline underline-offset-2 -mt-4"
              >
                Sign up here.
              </a>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function TemplateMockCode({
  template,
  isTeam: _isTeam,
}: {
  template: UserTemplatePreview;
  isTeam?: boolean;
}) {
  const project = useContext(RecipeProjectContext);
  const isTeam = _isTeam || project?.scope === ProjectScope.Team;

  const label = isTeam
    ? `${project ? project.title : "Team"} | ${template.recipe.title}`
    : `${template.recipe.project} | ${template.recipe.title}`;

  return (
    <div className="mockup-code h-full w-full">
      <pre className="px-4 py-2 whitespace-pre-wrap">
        <p className="text-xs font-bold">{label}</p>
        <p className="text-xs font-bold">
          Created by @{template.original_author.username}
        </p>

        <div className="flex-1 mt-8">
          <h3 className="font-bold text-lg">{template.title}</h3>
          <p className="text-sm ">{template.description}</p>
        </div>
      </pre>
    </div>
  );
}
