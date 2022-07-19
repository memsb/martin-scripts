const path = require('path');
const chalk = require('chalk');

const { reset_dir, has_file, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { sleep } = require('./utils/sleep.js');
const { open_component_in_jenkins } = require('./utils/browser.js');

const update_instance_types = async (dir, mapping) => {
    const envs = ['int', 'test', 'live'];
    for (const env of envs) {
        await update_instance_types_in_env(dir, env, mapping);
    };
}

const update_instance_types_in_env = async (dir, env, mapping) => {
    const filename = path.join(dir, `infrastructure/infrastructure/stacks/parameters/infrastructure/${env}.json`);
    if (has_file(filename)) {
        const parameters = read_json(filename);
        const [type, size] = parameters.parameters.InstanceType.split('.');

        if (type in mapping) {
            parameters.parameters.InstanceType = `${mapping[type]}.${size}`;

            console.log(`${type}.${size} -> ${mapping[type]}.${size}`);

            save_json(filename, parameters);
        } else {
            throw `No mapping found for instance type: ${type}.${size}`;
        }
    }
}

const update = async (repositories, mapping) => {
    const failed = [];
    const updated = [];

    let done = 0;
    const total = repositories.length;

    console.log(`Updating ${total} repositories...`);

    for await (repository of repositories) {
        console.log(repository);
        try {
            const component = path.basename(repository);
            const dir = path.join(checkout_dir, component);

            console.log(component);

            await checkout(`https://github.com/${repository}`, dir);
            await update_instance_types(dir, mapping);

            await commit(dir, `chore: updating ec2 instance type`);
            await push(dir);

            console.log(chalk.green('Updated.'));
            updated.push(repository);

            const minutes_delay = 2;

            console.log(`${(total - updated.length - failed.length) * minutes_delay} minutes remaining...`);
            await sleep(minutes_delay * 60 * 1000);
            
            open_component_in_jenkins(`https://jenkins7.ibl.api.bbci.co.uk/job/${component}`);
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
}

const checkout_dir = 'update-instance-types';
reset_dir(checkout_dir);


const mapping = {
    't2': 't3a',
    't3': 't3a',
    'c4': 'c6a',
    'c5': 'c6a',
    'm4': 'm6a',
    'm5': 'm6a'
};

update([
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
],
    mapping);
