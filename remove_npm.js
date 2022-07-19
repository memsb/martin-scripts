const path = require('path');
const chalk = require('chalk');
const open = require('open');

const { reset_dir, read_json, has_file, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { sleep } = require('./utils/sleep.js');

const remove_npm = async (dir) => {
    const package_json = path.join(dir, 'package.json')
    if (has_file(package_json)) {
        const contents = read_json(package_json);
        if ('spec' in contents && 'requires' in contents.spec) {
            contents.spec.requires = contents.spec.requires.filter((item) => item !== 'npm');
            save_json(package_json, contents);
        }
    }
}



const update = async (repositories) => {
    const failed = [];
    const updated = [];

    let done = 0;
    const total = Object.keys(repositories).length

    console.log(`Updating ${total} repositories...`);

    for (const repository of repositories) {
        console.log(repository);
        try {
            const dir = path.join(checkout_dir, path.basename(repository));

            await checkout(`https://github.com/${repository}`, dir);
            await remove_npm(dir);
            await commit(dir, `fix: remove npm from build requires`);
            await push(dir);

            console.log(chalk.green('Updated.'));
            updated.push(repository);

            const minutes = 2;
            console.log(`sleeping for ${minutes} minutes...`);
            await sleep(minutes * 60 * 1000); // 5 mins
            console.log(`${(total - updated.length - failed.length) * minutes} minutes remaining...`);

            const component = path.basename(repository)
            open(`https://jenkins7.ibl.api.bbci.co.uk/job/${component}`);
        } catch (e) {
            console.log(chalk.red('Update failed.'));
            console.log(e);
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
};

const checkout_dir = 'remove_npm';
reset_dir(checkout_dir);

update([
    "bbc/ibl-analytics-api",
    "bbc/ibl-broadcasts-api",
    "bbc/ibl-clip-fetcher",
    "bbc/ibl-clip-poller",
    "bbc/ibl-clips-api",
    "bbc/ibl-credibl-api",
    "bbc/ibl-credibl-detector",
    "bbc/ibl-credibl-gif-generator",
    "bbc/ibl-editorial-metadata-api",
    "bbc/ibl-episode-ingest",
    "bbc/ibl-episode-notifier",
    "bbc/ibl-episodes-api",
    "bbc/ibl-graph-fallbacks-handler",
    "bbc/ibl-graph-resolver",
    "bbc/ibl-group-fetcher",
    "bbc/ibl-group-poller",
    "bbc/ibl-groups-api",
    "bbc/ibl-highlights-api",
    "bbc/ibl-hubot",
    "bbc/ibl-inspector",
    "bbc/ibl-isite-fetcher",
    "bbc/ibl-isite-picker",
    "bbc/ibl-isite-proxy",
    "bbc/ibl-list-fetcher",
    "bbc/ibl-list-poller",
    "bbc/ibl-lists-api",
    "bbc/ibl-master-brands-api",
    "bbc/ibl-metadata-errors-api",
    "bbc/ibl-metadata-errors-ingest",
    "bbc/ibl-nibl",
    "bbc/ibl-persisted-queries-api",
    "bbc/ibl-popularity-api-v2",
    "bbc/ibl-programme-ingest",
    "bbc/ibl-programmes-api",
    "bbc/ibl-promotions-poller",
    "bbc/ibl-promotions-service",
    "bbc/ibl-schedules-fetcher",
    "bbc/ibl-slices-api",
    "bbc/ibl-smashibl-admin",
    "bbc/ibl-tag-extractor-v2",
    "bbc/ibl-universal-search",
    "bbc/ibl-user-activity",
    "bbc/ibl-user-play-writer",
    "bbc/iplayer-tools",
    "bbc/iplayer-tools-credits",
    "bbc/iplayer-tools-tags",
    "bbc/iplayer-tools-variants",
    "bbc/ibl-bundles-api"
]);
