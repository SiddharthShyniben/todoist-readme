const core = require("@actions/core");
const axios = require("axios");
const Humanize = require("humanize-plus");
const dayjs = require("dayjs");
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
  // Current weekly streak /
  // Max daily streak /
  // Max weekly streak /
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

  const dateForm = "dddd MMMM D YYYY";
  parsedData.goals.current_daily_streak.start = dayjs(parsedData.goals.current_daily_streak.start).format(dateForm);
  parsedData.goals.current_daily_streak.end = dayjs(parsedData.goals.current_daily_streak.end).format(dateForm);
  parsedData.goals.current_weekly_streak.start = dayjs(parsedData.goals.current_weekly_streak.start).format(dateForm);
  parsedData.goals.current_weekly_streak.end = dayjs(parsedData.goals.current_weekly_streak.end).format(dateForm);
  parsedData.goals.max_daily_streak.start = dayjs(parsedData.goals.max_daily_streak.start).format(dateForm);
  parsedData.goals.max_daily_streak.end = dayjs(parsedData.goals.max_daily_streak.end).format(dateForm);
  parsedData.goals.max_weekly_streak.start = dayjs(parsedData.goals.max_weekly_streak.start).format(dateForm);
  parsedData.goals.max_weekly_streak.end = dayjs(parsedData.goals.max_weekly_streak.end).format(dateForm);
  
  let ka = parsedData.karma_update_reasons;

  let newContent = prevReadmeContent
    .replace(/<td-kl>.*<\/td-kl>/g, `<td-kl>${parsedData.karma_level}</td-kl>`)
    .replace(/<td-k>.*<\/td-k>/g, `<td-k>${Humanize.formatNumber(parsedData.karma)}</td-k>`)
    .replace(/<td-kc>.*<\/td-kc>/g, `<td-kc>${Humanize.compactInteger(~~parsedData.karma)}</td-kc>`)
    .replace(/<td-ttc>.*<\/td-ttc>/g, `<td-ttc>${parsedData.completed_count}</td-ttc>`)
    .replace(/<td-cdsc>.*<\/td-cdsc>/g, `<td-cdsc>${Humanize.formatNumber(parsedData.goals.current_daily_streak.count)}</td-cdsc>`)
    .replace(/<td-cdsf>.*<\/td-cdsf>/g, `<td-cdsf>${parsedData.goals.current_daily_streak.start}</td-cdsf>`)
    .replace(/<td-cdst>.*<\/td-cdst>/g, `<td-cdst>${parsedData.goals.current_daily_streak.end}</td-cdst>`)
    .replace(/<td-cwsc>.*<\/td-cwsc>/g, `<td-cwsc>${Humanize.formatNumber(parsedData.goals.current_weekly_streak.count)}</td-cwsc>`)
    .replace(/<td-cwsf>.*<\/td-cwsf>/g, `<td-cwsf>${parsedData.goals.current_weekly_streak.start}</td-cwsf>`)
    .replace(/<td-cwst>.*<\/td-cwst>/g, `<td-cwst>${parsedData.goals.current_weekly_streak.end}</td-cwst>`)
    .replace(/<td-mdsc>.*<\/td-mdsc>/g, `<td-mdsc>${Humanize.formatNumber(parsedData.goals.max_daily_streak.count)}</td-mdsc>`)
    .replace(/<td-mdsf>.*<\/td-mdsf>/g, `<td-mdsf>${parsedData.goals.max_daily_streak.start}</td-mdsf>`)
    .replace(/<td-mdst>.*<\/td-mdst>/g, `<td-mdst>${parsedData.goals.max_daily_streak.end}</td-mdst>`)
    .replace(/<td-mwsc>.*<\/td-mwsc>/g, `<td-mwsc>${Humanize.formatNumber(parsedData.goals.max_weekly_streak.count)}</td-mwsc>`)
    .replace(/<td-mwsf>.*<\/td-mwsf>/g, `<td-mwsf>${parsedData.goals.max_weekly_streak.start}</td-mwsf>`)
    .replace(/<td-mwst>.*<\/td-mwst>/g, `<td-mwst>${parsedData.goals.max_weekly_streak.end}</td-mwst>`);
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
