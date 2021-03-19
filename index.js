const core = require("@actions/core");
const axios = require("axios");
// const Humanize = require("humanize-plus");
const fs = require("fs");
const exec = require("./exec");
const { JSDOM } = require("jsdom");

const TODOIST_API_KEY = core.getInput("TODOIST_API_KEY");
const PREMIUM = core.getInput("PREMIUM");

async function main() {
  const stats = await axios(`https://api.todoist.com/sync/v8.3/completed/get_stats?token=${TODOIST_API_KEY}`);
  await updateReadme(stats.data);
}

let jobFailFlag = false;
const README_FILE_PATH = "./README.md";

async function updateReadme(data) {
  if (data) {
    const readmeData = fs.readFileSync(README_FILE_PATH, "utf8");
    const newReadme = buildReadme(readmeData, data);
    if (newReadme !== readmeData) {
      core.info("Writing to " + README_FILE_PATH);
      fs.writeFileSync(README_FILE_PATH, newReadme);
      if (!process.env.TEST_MODE) {
        commitReadme();
      }
    } else {
      core.info("No change detected, skipping");
      process.exit(0);
    }
  } else {
    core.info("Nothing fetched");
    process.exit(jobFailFlag ? 1 : 0);
  }
}


const buildReadme = (prevReadmeContent, data) => {
  // Data needed: 
  // Karma Level
  // Karma Count
  // Total tasks completed
  // Current Daily streak
  // Current weekly streak
  // Max daily streak
  // Max weekly streak
  // Karma Activity
  // Karma Trend Graph
  
  const parsedData = {
    lastKarmaUpdate: data.karma_last_update,
    karmaTrend: data.karma_trend,
    // days_items: not needed
    tasksCompleted: data.completed_count,
    karma: data.karma,
    // week_items: not needed
    goals: data.goals,
    karmaActivity: data.karma_update_reasons
  };
  
  let karma = data.karma;
  parseData.karmaLevel =
    karma <= 499 ? "Beginner" :
      karma <= 2499 ? "Novice" :
        karma <= 4999 ? "Intermediate" :
          karma <= 7499 ? "Professional" :
            karma <= 9999 ? "Expert" :
              karma <= 19999 ? "Master" :
                karma <= 49999 ? "Grandmaster" : "Enlightened";
  
  const { document } = new JSDOM(prevReadmeContent).window;
  document.querySelectorAll("td-karma-level").forEach(element => element.innerHTML = parsedData.karmaLevel);
  return document.body.innerHTML;
};

const commitReadme = async () => {
  // Getting config
  const committerUsername = "SidharthShyniben";
  const committerEmail = "example@gmail.com";
  const commitMessage = "Todoist updated.";
  // Doing commit and push
  await exec("git", ["config", "--global", "user.email", committerEmail]);
  await exec("git", ["config", "--global", "user.name", committerUsername]);
  await exec("git", ["add", README_FILE_PATH]);
  await exec("git", ["commit", "-m", commitMessage]);
  // await exec('git', ['fetch']);
  await exec("git", ["push"]);
  core.info("Readme updated successfully.");
  // Making job fail if one of the source fails
  process.exit(jobFailFlag ? 1 : 0);
};

(async () => await main())();
