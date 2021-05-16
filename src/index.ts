import inquirer from "inquirer";
import ora from "ora";
import { bandcampScrapper } from "./bandcamp";
import { depopScrapper } from "./depop";

enum Website {
  BANDCAMP,
  BIG_CARTEL,
  DEPOP,
}

(async () => {
  const { website, ID } = await inquirer.prompt<{
    website: Website;
    ID: string;
  }>([
    {
      type: "list",
      name: "website",
      message: "Select Website",
      choices: [
        {
          name: "Bandcamp",
          value: Website.BANDCAMP,
        },
        {
          name: "Big Cartel",
          value: Website.BIG_CARTEL,
          disabled: "Not Yet Available",
        },
        {
          name: "Depop",
          value: Website.DEPOP,
        },
      ],
    },
    {
      type: "input",
      name: "ID",
      message: "Provide the ID",
      validate: function (value) {
        if (value) {
          return true;
        }
        return "Please enter a valid ID";
      },
    },
  ]);

  const spinner = ora("Scrapping").start();
  try {
    switch (website) {
      case Website.BANDCAMP:
        await bandcampScrapper(ID);
        break;
      case Website.BIG_CARTEL:
        console.log("Not yet implemented");
        break;
      case Website.DEPOP:
        await depopScrapper(ID);
        break;
    }
  } catch (error) {
    console.error(error);
  } finally {
    spinner.stop();
  }
})();
