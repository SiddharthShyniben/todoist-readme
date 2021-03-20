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
    [/<td-kl>.*<\/td-kl>/g, `<td-kl>${parsedData.karma_level}</td-kl>`],
    [/<td-k>.*<\/td-k>/g, `<td-k>${parsedData.karma}</td-k>`],
    [/<td-ttc>.*<\/td-ttc>/g, `<td-ttc>${parsedData.completed_count}</td-ttc>`],
    [/<td-cdsc>.*<\/td-cdsc>/g, `<td-cdsc>${parsedData.goals.current_daily_streak.count}</td-cdsc>`],
    [/<td-cdsf>.*<\/td-cdsf>/g, `<td-cdsf>${parsedData.goals.current_daily_streak.start}</td-cdsf>`],
    [/<td-cdst>.*<\/td-cdst>/g, `<td-cdst>${parsedData.goals.current_daily_streak.end}</td-cdst>`],
    [/<td-cwsc>.*<\/td-cwsc>/g, `<td-cwsc>${parsedData.goals.current_weekly_streak.count}</td-cwsc>`],
    [/<td-cwsf>.*<\/td-cwsf>/g, `<td-cwsf>${parsedData.goals.current_weekly_streak.start}</td-cwsf>`],
    [/<td-cwst>.*<\/td-cwst>/g, `<td-cwst>${parsedData.goals.current_weekly_streak.end}</td-cwst>`]
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
