import express from "express";
import "dotenv/config";
import { Octokit } from "octokit";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";
import cors from "cors";

const app = express();
const port = 2537;
//app.use(cors({
//  origin: process.env.FRONTEND_URL,
//}));
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const queries = {
  "getStarred": `
    query {
      user(login: "Julek-Git") {
        pinnedItems(first: 6) {
          nodes {
            ... on Repository {
              name,
              description,
              url,
              stargazerCount,
              forkCount,
            }
          }
        }
      }
    }
  `,
};

const getCache = async (query) => {
  await ensureCacheFile();
  const toMilliseconds = (hrs,min,sec) => (hrs*60*60+min*60+sec)*1000;
  try {
    const data = await readFile("cache/queries.json", "utf-8");
    const json = JSON.parse(data);
    if (json[query] === undefined) throw new Error("Query doesn't exist in cache");
    if (json[query].timestamp <= Date.now() - toMilliseconds(6, 0, 0)) throw new Error("Cached query is too old");
    return json[query].value;
  } catch (e) {
    console.error(`getCache: ${e}`);
    return undefined;
  }
};

const setCache = async (query, value) => {
  await ensureCacheFile();
  try {
    const data = await readFile("cache/queries.json", "utf-8");
    const json = JSON.parse(data);
    json[query] = {
      value,
      timestamp: Date.now(),
    };
    const write_result = await writeFile("cache/queries.json", JSON.stringify(json, null, 2));
  } catch (e) {
    console.error(`setCache: ${e}`);
  }
};


app.get("/", (req, res) => {
  res.send("Hello API!");
});

app.get("/get/:query", async (req, res) => {
  const query = req.params.query;
  const gql_query = queries[query];
  if (gql_query === undefined) {
    return res.json({"status": "Not found"});
  }
  const cache = await getCache(query);
  let api_response = cache;
  if (cache === undefined) {
    api_response = await octokit.graphql(gql_query);
    await setCache(query, api_response);
  }
  res.json(api_response);
});

const ensureCacheFile = async () => {
  if (!existsSync("cache/queries.json")) {
    await mkdir("cache", { recursive: true });
    await writeFile("cache/queries.json", "{}");
  }
};
await ensureCacheFile();

app.listen(port, () => {
  console.log(`Server running at port ${port}`);
});
