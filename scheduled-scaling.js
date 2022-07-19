const path = require('path');
const chalk = require('chalk');

const { reset_dir, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');

const { get_resources_by_type } = require('./utils/aws.js');

const set_timezone_on_scheduled_actions = async (dir, timezone) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/stacks/templates/infrastructure.json');
    const infrastructure = read_json(filename);

    const actions = get_resources_by_type(infrastructure.Resources, 'AWS::AutoScaling::ScheduledAction');
    for (action of actions) {
        infrastructure.Resources[action].Properties.TimeZone = timezone;
    }

    save_json(filename, infrastructure);
}

const update = async (repositories, timezone) => {
    const failed = [];
    const updated = [];

    let done = 0;
    const total = repositories.length;

    console.log(`Updating ${total} repositories...`);

    for await (repository of repositories) {
        console.log(repository);
        try {
            const dir = path.join(checkout_dir, path.basename(repository));
            console.log(dir);

            await checkout(`https://github.com/${repository}`, dir);
            await set_timezone_on_scheduled_actions(dir, timezone);

            await commit(dir, `chore: setting timezone on scheduled scaling`);
            await push(dir);

            console.log(chalk.green('Updated.'));
            updated.push(repository);
        } catch (e) {
            console.log(chalk.red('Update failed.'));
            failed.push(repository);
        }

        console.log(`${++done}/${total}`);
    }

    if (updated.length > 0) {
        console.log(chalk.green('Updated:', updated));
    }
    if (failed.length > 0) {
        console.log(chalk.red('Failed:', failed));
    }
}

const checkout_dir = 'scheduled-actions';
reset_dir(checkout_dir);

update([
    "bbc/ibl-user-play-writer",
    "bbc/ibl-programmes-api",
    "bbc/ibl-user-activity",
    "bbc/ibl-bundles-api",
    "bbc/ibl-graph-resolver",
    "bbc/ibl-graph-fallbacks-handler",
    "bbc/ibl-episodes-api",
    "bbc/ibl-smashibl-cluster"
],
    'Europe/London');