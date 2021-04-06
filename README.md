# `todoist-readme`

[![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FSiddharthShyniben%2Ftodoist-readme&count_bg=%2360A5FA&title_bg=%23000000&icon=&icon_color=%23E7E7E7&title=visits&edge_flat=false)](https://hits.seeyoufarm.com)
![GitHub commit activity](https://img.shields.io/github/commit-activity/y/SiddharthShyniben/todoist-readme)
![GitHub contributors](https://img.shields.io/github/contributors/SiddharthShyniben/todoist-readme)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/SiddharthShyniben/todoist-readme)
![Integrates with Todoist](https://img.shields.io/badge/Integrates%20with-Todoist-red?style=flat&logo=todoist&logoColor=white)

`todoist-readme` is a ***extremely-customizable*** Github Action for showcasing your Todoist Stats on a README file in GitHub.

## About

This is a github action which allows you to display your todoist stats in a README file, preferably the [profile readme](https://docs.github.com/en/github/setting-up-and-managing-your-github-profile/managing-your-profile-readme).

### Stats shown: 

This action displays a variety of stats like **Karma Count**, **Karma Level**, **Total Tasks Completed**, **Streak Data (Start date, end date, daily/weekly, current/max)**, **Recent Karma Activity**, etc.

### Alternative

This repo was forked from [abhisheknaiidu/todoist-readme](https://github.com/abhisheknaiidu/todoist-readme), which you can use if you don't want too much customization. 

## Installation

### Preparation

-   Obviously, you will need a Todoist Account. You will also need your Todoist API key. You can get that from [here](https://todoist.com/prefs/integrations)

-   You need to save the Todoist API Token in the repository secrets. You can find that in the Settings of your Repository.
    -   Be sure to save those as the following: `TODOIST_API_KEY = <your todoist API token>`

### Usage

1. First, create a new GitHub Workflow.

    1. In your repository, create the `.github/workflows/` directory to store your workflow files.
    2. In the `.github/workflows/` directory, create a new file called `readme-with-todoist.yml` and add the following code:

    ```yml
    name: README with Todoist

    on:
        workflow_dispatch:
        schedule:
            # Runs every minute; change it as you like
            - cron: "* * * * *"

    jobs:
        update-readme:
            name: Update todoist stats
            runs-on: ubuntu-latest
            steps:
                - uses: actions/checkout@v2
                - uses: SiddharthShyniben/todoist-readme@1.3.0
                  with:
                      TODOIST_API_KEY: ${{ secrets.TODOIST_API_KEY }}
                      # README_FILE_PATH: "alternate readme file path here; defaults to ./README.md"
    ```

2. Open the README file (`/README.md`), and add some of the following HTML tags in your README. The tags will automagically get filled with the specified stats. <u>**_This gives you the power to place your stats in any design you like;_**</u> You can make the stats bold by doing `**<td-kl></td-kl>**` for example. If you are an svg expert, you can make a custom profile card and add the tags. The possibilities are endless.

* `<td-k>`: Your Todoist karma count.
* `<td-kc>`: Your Todoist karma count, in compact form (If you have 10,000 karma, It will be displayed as 10k).
* `<td-kl>`: Your Todoist Karma level
* `<td-ttc>`: The number of tasks you have ever completed in Todoist 
* `<td-cdsc>`: The number of days you have completed your daily goal (known as a daily streak)
* `<td-cdsf>`: The day on which your current Todoist daily streak has started
* `<td-cdst>`: The day on which your current Todoist daily streak has ended (most of the time this will be today or yesterday)
* `<td-cwsc>`: The number of weeks you have completed your weekly goal (known as a weekly streak)
* `<td-cwsf>`: The day on which your current Todoist weekly streak has started
* `<td-cwst>`: The day on which your current Todoist daily streak has ended (most of the time this will be this week or last week)
* `<td-mdsc>`: The length of your longest daily streak
* `<td-mdsf>`: The day on which your longest Todoist daily streak has started
* `<td-mdst>`: The day on which your longest Todoist daily streak has ended
* `<td-mwsc>`: The length of your longest weekly streak
* `<td-mwsf>`: The day on which your longest Todoist weekly streak has started
* `<td-mwst>`: The day on which your longest Todoist daily streak has ended
* `<td-ka>`: A list showing your Todoist Karma activity. There is a known bug: You need to add a single line directly above the element. This is because the `<td-ka>` element is considered as a block element by default, and the markdown inside block elements won't be parsed. Adding a line above makes the element inline (I guess??).
  Example: 
  ```markdown
  Here's a log of my activity...
  <td-ka></td-ka>
  ```
* _More coming soon..._

Here's a simple example of how you can place the tags: 

```markdown
# Todoist Stats

Hello, my name is Siddharth.
I am a Todoist <td-kl></td-kl>
<!-- td-kl will be filled with your Todoist karma level -->
```

## Contributing

Pull requests are welcome. For major changes, please open an discussion first to discuss what you would like to change.
