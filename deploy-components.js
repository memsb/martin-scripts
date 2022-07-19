const path = require('path');
const chalk = require('chalk');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { reset_dir } = require('./utils/file.js');
const { get_release_tag, checkout } = require('./utils/git.js');
const { ci } = require('./utils/npm.js');
const { open_component_in_cosmos } = require('./utils/browser.js');


const deploy_to_environment = async (dir, environment = 'test') => {
    const component = path.basename(dir);
    const tag = await get_release_tag(dir);

    const env_flag = environment == 'test' ? '-e test' : '';

    const deploy_command = `ibl-deploy ${env_flag} ${tag}`;
    console.log(deploy_command);
    await exec(deploy_command, { cwd: dir });
}

const deploy = async (repositories, environment = 'test') => {
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
            // await deploy_to_environment(dir, environment);

            console.log(chalk.green('Deployed.'));
            updated.push(repository);
        } catch (e) {
            console.log(chalk.red('Deployment failed.'));
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

const checkout_dir = 'deploy';
reset_dir(checkout_dir);

deploy([
    "bbc/ibl-programmes-api",
    "bbc/ibl-group-fetcher",
    "bbc/ibl-list-fetcher",
    "bbc/ibl-credibl-gif-generator",
    "bbc/ibl-editorial-metadata-api",
    "bbc/ibl-user-play-writer",
    "bbc/ibl-groups-api",
    "bbc/ibl-edibl",
    "bbc/ibl-programme-ingest",
    "bbc/ibl-search",
    "bbc/ibl-persisted-queries-api",
    "bbc/ibl-episode-ingest",
    "bbc/ibl-episodes-api",
    "bbc/ibl-graph-resolver",
    "bbc/ibl-tag-extractor-v2",
    "bbc/ibl-nibl",
    "bbc/ibl-highlights-api",
    "bbc/ibl-curator-api",
    "bbc/ibl-slices-api",
    "bbc/ibl-starfruit",
    "bbc/ibl-analytics-api",
    "bbc/ibl-bundles-api",
    "bbc/ibl-user-activity",
    "bbc/iplayer-tools-credits",
    "bbc/ibl-credibl-api",
    "bbc/ibl-graph-fallbacks-handler",
    "bbc/ibl-broadcasts-api",
    "bbc/ibl-appw-gateway",
    "bbc/iplayer-tools-tags",
    "bbc/ibl-popularity-api-v2",
    "bbc/ibl-variants-api",
    "bbc/ibl-group-episodes-fetcher",
    "bbc/ibl-isite-proxy",
    "bbc/ibl-metadata-errors-api",
    "bbc/ibl-list-poller",
    "bbc/ibl-promotions-service",
    "bbc/iplayer-tools",
    "bbc/ibl-graph-edge",
    "bbc/ibl-clip-fetcher",
    "bbc/ibl-databases",
    "bbc/iplayer-tools-variants",
    "bbc/iplayer-tools-curator",
    "bbc/ibl-metadata-errors-ingest",
    "bbc/ibl-clips-api",
    "bbc/ibl-master-brands-api",
    "bbc/ibl-lists-api",
    "bbc/ibl-tag-api",
    "bbc/ibl-isite-fetcher",
    "bbc/ibl-inspector",
    "bbc/ibl-group-poller",
    "bbc/ibl-schedules-fetcher",
    "bbc/ibl-promotions-poller",
    "bbc/ibl-universal-search",
    "bbc/ibl-episode-notifier",
    "bbc/ibl-clip-poller"
], 'test');
