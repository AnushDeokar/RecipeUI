"use server";

import { DownloadContainer } from "@/app/download/DownloadContainer";

export default async function DownloadPage() {
  let latestVersion: string = "0.5.0";

  // For some reason latest version is not propogating?
  // try {
  //   const latestJson = await (
  //     await fetch(
  //       "https://github.com/RecipeUI/RecipeUI/releases/latest/download/latest.json"
  //     )
  //   ).json();
  //   const version = latestJson.version;

  //   if (version) {
  //     latestVersion = version;
  //   }
  // } catch (e) {
  //   console.error(e);
  // }

  return <DownloadContainer latestVersion={latestVersion} />;
}
