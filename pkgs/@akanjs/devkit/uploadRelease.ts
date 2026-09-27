import { Logger, RestClient } from "akanjs/common";

import { Spinner } from "./spinner";

const spinning = (message: string) => new Spinner(message, { prefix: message, enableSpin: true }).start();

export const uploadRelease = async (
  appName: string,
  {
    workspaceRoot,
    environment,
    buildNum,
    platformVersion,
    os,
    local,
  }: {
    workspaceRoot: string;
    environment: string;
    buildNum: number;
    platformVersion?: string;
    os?: "android" | "ios";
    local?: boolean;
  },
) => {
  const logger = new Logger("uploadRelease");
  const basePath = local ? "http://localhost:8282/backend" : "https://cloud.akanjs.com/backend";
  const httpClient = new RestClient(basePath);
  const readingFilesSpinner = spinning("Reading files...");
  try {
    const uploads = [
      [`builds/${appName}-release.tar.gz`, `${appName}-release.tar.gz`],
      [`sources/${appName}-source.tar.gz`, `${appName}-source.tar.gz`],
      [`builds/${appName}-appBuild.zip`, `${appName}-appBuild.zip`],
    ].map(([relativePath, name]) => ({ file: Bun.file(`${workspaceRoot}/releases/${relativePath}`), name }));
    const metas = uploads.map(({ file }) => ({ lastModifiedAt: new Date(file.lastModified), size: file.size }));
    readingFilesSpinner.succeed("Reading files... done");

    const preparingFormSpinner = spinning("Preparing form data...");
    const formData = new FormData();
    for (const { file, name } of uploads) formData.append("files", file, name);
    formData.append("metas", JSON.stringify(metas));
    formData.append("type", "release");
    preparingFormSpinner.succeed("Preparing form data... done");

    try {
      const uploadingFilesSpinner = spinning("Uploading files to server...");
      const [buildFile, sourceFile, appBuildFile] = await httpClient.post<
        [{ id: string }, { id: string }, { id: string }]
      >("/file/addFiles", formData);
      uploadingFilesSpinner.succeed("Uploading files to server... done");

      const fetchingAppSpinner = spinning(`Fetching dev app information for ${appName}...`);
      const major = platformVersion ? parseInt(platformVersion.split(".")[0]) : 1;
      const minor = platformVersion ? parseInt(platformVersion.split(".")[1]) : 0;
      const patch = platformVersion ? parseInt(platformVersion.split(".")[2]) : 0;

      const devApp = await httpClient.get<{ id: string }>(`/devApp/devAppInName/${appName}`);
      fetchingAppSpinner.succeed(`Fetching dev app information for ${appName}... done`);

      const pushingReleaseSpinner = spinning(`Pushing release to ${environment} environment...`);
      const release = await httpClient.post<{ id: string }>(
        `/release/pushRelease/${devApp.id}/${environment}/${major}/${minor}/${patch}/${sourceFile.id}/${buildFile.id}/${appBuildFile.id}${os ? `/${os}` : ""}`,
      );
      pushingReleaseSpinner.succeed(`Pushing release to ${environment} environment... done`);
      new Spinner(`Successfully pushed release to ${appName}-${environment} server. `, {
        prefix: `Successfully pushed release to ${appName}-${environment} server. `,
        enableSpin: false,
      }).succeed(`Successfully pushed release to ${appName}-${environment} server. `);
      return release;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      logger.error(`Upload release failed: ${errorMessage}`);
      return null;
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : "Unknown error";
    readingFilesSpinner.fail(`Reading files failed: ${errorMessage}`);
    return null;
  }
};
