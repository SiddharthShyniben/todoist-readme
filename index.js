const core = require("@actions/core");
const axios = require("axios");
// const Humanize = require("humanize-plus");
const fs = require("fs");
const exec = require("./exec");
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
  // Karma Level /
  // Karma Count /
  // Total tasks completed /
  // Current Daily streak /
  // Current weekly streak
  // Max daily streak
  // Max weekly streak
  // Karma Activity
  // Karma Trend Graph

  let parsedData = data;

  let karma = parsedData.karma;
  parsedData.karma_level =
    karma <= 499 ? "Beginner" :
      karma <= 2499 ? "Novice" :
        karma <= 4999 ? "Intermediate" :
          karma <= 7499 ? "Professional" :
            karma <= 9999 ? "Expert" :
              karma <= 19999 ? "Master" :
                karma <= 49999 ? "Grandmaster" : "Enlightened";

  parsedData.goals.current_daily_streak.start = new Date(Date.parse(parsedData.goals.current_daily_streak.start)).toDateString();
  parsedData.goals.current_daily_streak.end = new Date(Date.parse(parsedData.goals.current_daily_streak.end)).toDateString();
  parsedData.goals.current_weekly_streak.start = new Date(Date.parse(parsedData.goals.current_weekly_streak.start)).toDateString();
  parsedData.goals.current_weekly_streak.end = new Date(Date.parse(parsedData.goals.current_weekly_streak.end)).toDateString();

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  days.forEach(day => {
    parsedData.goals.current_daily_streak.start.replace(day.substring(0, 4), day);
    parsedData.goals.current_daily_streak.end.replace(day.substring(0, 4), day);
    parsedData.goals.current_weekly_streak.start.replace(day.substring(0, 4), day);
    parsedData.goals.current_weekly_streak.end.replace(day.substring(0, 4), day);
  });
  months.forEach(month => {
    parsedData.goals.current_daily_streak.start.replace(month.substring(0, 4), month);
    parsedData.goals.current_daily_streak.end.replace(month.substring(0, 4), month);
    parsedData.goals.current_weekly_streak.start.replace(month.substring(0, 4), month);
    parsedData.goals.current_weekly_streak.end.replace(month.substring(0, 4), month);
  });

  let tags = [
    [/<(td-karma-level|tdkl)>.*<\/(td-karma-level|tdkl)>/g, `<$1>${parsedData.karma_level}</$2>`],
    [/<(td-karma|tdk)>.*<\/(td-karma|tdk)>/g, `<$1>${parsedData.karma}</$2>`],
    [/<(td-total-tasks-completed|tdttc)>.*<\/(td-total-tasks-completed|tdttc)>/g, `<$1>${parsedData.completed_count}</$2>`],
    [/<(td-current-daily-streak-count|tdcdsc)>.*<\/(td-current-daily-streak-count|tdcdsc)>/g, `<$1>${parsedData.goals.current_daily_streak.count}</$2>`],
    [/<(td-current-daily-streak-from|tdcdsf)>.*<\/(td-current-daily-streak-from|tdcdsf)>/g, `<$1>${parsedData.goals.current_daily_streak.start}</$2>`],
    [/<(td-current-daily-streak-to|tdcdst)>.*<\/(td-current-daily-streak-to|tdcdst)>/g, `<$1>${parsedData.goals.current_daily_streak.end}</$2>`],
    [/<(td-current-weekly-streak-count|tdcwsc)>.*<\/(td-current-weekly-streak-count|tdcwsc)>/g, `<$1>${parsedData.goals.current_weekly_streak.count}</$2>`],
    [/<(td-current-weekly-streak-from|tdcwsf)>.*<\/(td-current-weekly-streak-from|tdcwsf)>/g, `<$1>${parsedData.goals.current_weekly_streak.start}</$2>`],
    [/<(td-current-weekly-streak-to|tdcwst)>.*<\/(td-current-weekly-streak-to|tdcwst)>/g, `<$1>${parsedData.goals.current_weekly_streak.end}</$2>`]
  ];

  let newContent = prevReadmeContent;
  tags.forEach(tag => newContent.replace(tag[0], tag[1]));
  return newContent;
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
