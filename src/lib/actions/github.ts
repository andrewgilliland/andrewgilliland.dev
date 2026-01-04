"use server";
const getGithubRepos = async (username: string) => {
  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos`
    );
    const data: [] = await response.json();

    return data;
  } catch (error) {
    console.error(error);
  }
};

const getDataFromJSONGithubRepo = async ({
  fileName,
}: {
  fileName: string;
}) => {
  // More deep thoughts: https://www.sccs.swarthmore.edu/users/99/mimno/humor/deep.thoughts.txt
  try {
    const response = await fetch(
      `https://api.github.com/repos/andrewgilliland/JSON/contents/${fileName}.json`
    );
    const responseData = await response.json();

    const content = Buffer.from(responseData.content, "base64").toString(
      "utf-8"
    );
    const { data } = await JSON.parse(content);

    return data;
  } catch (error) {
    console.error(error);
  }
};

const getMarkdownFromGithubRepo = async () => {
  try {
  } catch (error) {
    console.error(error);
  }
};

export {
  getGithubRepos,
  getDataFromJSONGithubRepo as getGithubRepoFileContents,
};
