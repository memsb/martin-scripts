const path = require('path');
const chalk = require('chalk');
const semver = require('compare-versions');

const { reset_dir, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { install, update_package_dev } = require('./utils/npm.js');
const { sleep } = require('./utils/sleep.js');

const get_repositories = (dependency, target_version) => {
    const all_packages = read_json('all-packages.json');

    let repositories = [];

    if (dependency in all_packages) {
        const package_versions = all_packages[dependency];
        for (const [key, repos] of Object.entries(package_versions)) {
            if (semver.satisfies(target_version, key)) {
                repositories = repositories.concat(repos);
            }
        }
    }

    return repositories;
};

const get_repository_upgrades = (packages) => {
    const repositories = {};

    for (const [dependency, target_version] of Object.entries(packages)) {
        const repos_to_update = get_repositories(dependency, target_version);
        for (repo of repos_to_update) {
            if (!(repo in repositories)) {
                repositories[repo] = {};
            }
            repositories[repo][dependency] = target_version;
        }
    }

    return repositories;
}

const upgrade_dependencies = async (dir, dependencies) => {
    const packages = Object.entries(dependencies).map(([dependency, target_version]) => `${dependency}@${target_version}`);

    for (let i = 0; i < packages.length; i++) {
        await update_package_dev(dir, packages[i]);
    }
}

const fix_github_dependencies = async (dir) => {
    const filename = path.join(dir, '/package.json');
    const package_json = read_json(filename);
    if ('devDependencies' in package_json && 'cosmos-deploy' in package_json.devDependencies) {
        const version = package_json.devDependencies['cosmos-deploy'].split('#').pop();
        package_json.devDependencies['cosmos-deploy'] = `git@github.com:bbc/cosmos-deploy#${version}`;
        save_json(filename, package_json);
        await install(dir);
    }
}

const has_script = (dir, script_name) => {
    const filename = path.join(dir, '/package.json');
    const package_json = read_json(filename);
    return 'scripts' in package_json && script_name in package_json.scripts
}

const apply_upgrades_to_repo = async (dir, dependencies) => {
    if (has_script(dir, 'spec')) {
        await fix_github_dependencies(dir);
        await upgrade_dependencies(dir, dependencies);
        await commit(dir, `chore: updating speculate`);
    }
}

const fix_cosmos_deploy = async (dir) => {
    const filename = path.join(dir, '/package.json');
    const package_json = read_json(filename);
    if ('devDependencies' in package_json && 'cosmos-deploy' in package_json.devDependencies) {
        const version = package_json.devDependencies['cosmos-deploy'].split('#').pop();
        package_json.devDependencies['cosmos-deploy'] = `github:bbc/cosmos-deploy#${version}`;
        save_json(filename, package_json);
        await install(dir);
        await commit(dir, `chore: fixing cosmos-deploy`);
        await push(dir);
    }
}

const update = async (repositories) => {
    const failed = [];
    const updated = [];

    let done = 0;
    const total = Object.keys(repositories).length

    console.log(`Updating ${total} repositories...`);

    for (const [repository, dependencies] of Object.entries(repositories)) {
        console.log(repository);
        try {
            const dir = path.join(checkout_dir, path.basename(repository));

            await checkout(`https://github.com/${repository}`, dir);
            // await apply_upgrades_to_repo(dir, dependencies);
            await fix_cosmos_deploy(dir);


            // await sleep(30 * 1000);

            console.log(chalk.green('Updated.'));
            updated.push(repository);
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

const checkout_dir = 'package-upgrades';
reset_dir(checkout_dir);

update({
    'bbc/cloud-varnish-test': { "speculate": "3.1.2" },
    'bbc/ibl-analytics-api': { "speculate": "3.1.2" },
    'bbc/ibl-appw-gateway': { "speculate": "3.1.2" },
    'bbc/ibl-broadcasts-api': { "speculate": "3.1.2" },
    'bbc/ibl-bundles-api': { "speculate": "3.1.2" },
    'bbc/ibl-clip-fetcher': { "speculate": "3.1.2" },
    'bbc/ibl-clip-poller': { "speculate": "3.1.2" },
    'bbc/ibl-clips-api': { "speculate": "3.1.2" },
    'bbc/ibl-credibl-api': { "speculate": "3.1.2" },
    'bbc/ibl-credibl-gif-generator': { "speculate": "3.1.2" },
    'bbc/ibl-curator-api': { "speculate": "3.1.2" },
    'bbc/ibl-databases': { "speculate": "3.1.2" },
    'bbc/ibl-documentation': { "speculate": "3.1.2" },
    'bbc/ibl-edibl': { "speculate": "3.1.2" },
    'bbc/ibl-editorial-metadata-api': { "speculate": "3.1.2" },
    'bbc/ibl-episode-notifier': { "speculate": "3.1.2" },
    'bbc/ibl-episodes-api': { "speculate": "3.1.2" },
    'bbc/ibl-graph-edge': { "speculate": "3.1.2" },
    'bbc/ibl-graph-fallbacks-handler': { "speculate": "3.1.2" },
    'bbc/ibl-graph-resolver': { "speculate": "3.1.2" },
    'bbc/ibl-group-episodes-fetcher': { "speculate": "3.1.2" },
    'bbc/ibl-group-fetcher': { "speculate": "3.1.2" },
    'bbc/ibl-group-poller': { "speculate": "3.1.2" },
    'bbc/ibl-groups-api': { "speculate": "3.1.2" },
    'bbc/ibl-highlights-api': { "speculate": "3.1.2" },
    'bbc/ibl-hubot': { "speculate": "3.1.2" },
    'bbc/ibl-inspector': { "speculate": "3.1.2" },
    'bbc/ibl-isite-fetcher': { "speculate": "3.1.2" },
    'bbc/ibl-isite-picker': { "speculate": "3.1.2" },
    'bbc/ibl-isite-proxy': { "speculate": "3.1.2" },
    'bbc/ibl-jenkins-agents-7': { "speculate": "3.1.2" },
    'bbc/ibl-jenkins-master-7': { "speculate": "3.1.2" },
    'bbc/ibl-list-fetcher': { "speculate": "3.1.2" },
    'bbc/ibl-list-poller': { "speculate": "3.1.2" },
    'bbc/ibl-lists-api': { "speculate": "3.1.2" },
    'bbc/ibl-master-brands-api': { "speculate": "3.1.2" },
    'bbc/ibl-metadata-errors-api': { "speculate": "3.1.2" },
    'bbc/ibl-metadata-errors-ingest': { "speculate": "3.1.2" },
    'bbc/ibl-nibl': { "speculate": "3.1.2" },
    'bbc/ibl-persisted-queries-api': { "speculate": "3.1.2" },
    'bbc/ibl-popularity-api-v2': { "speculate": "3.1.2" },
    'bbc/ibl-programme-ingest': { "speculate": "3.1.2" },
    'bbc/ibl-programmes-api': { "speculate": "3.1.2" },
    'bbc/ibl-programmes-api-icat': { "speculate": "3.1.2" },
    'bbc/ibl-promotions-poller': { "speculate": "3.1.2" },
    'bbc/ibl-promotions-service': { "speculate": "3.1.2" },
    'bbc/ibl-schedules-fetcher': { "speculate": "3.1.2" },
    'bbc/ibl-search': { "speculate": "3.1.2" },
    'bbc/ibl-slices-api': { "speculate": "3.1.2" },
    'bbc/ibl-smashibl-admin': { "speculate": "3.1.2" },
    'bbc/ibl-starfruit': { "speculate": "3.1.2" },
    'bbc/ibl-tag-api': { "speculate": "3.1.2" },
    'bbc/ibl-tag-extractor-v2': { "speculate": "3.1.2" },
    'bbc/ibl-universal-search': { "speculate": "3.1.2" },
    'bbc/ibl-user-activity': { "speculate": "3.1.2" },
    'bbc/ibl-user-play-writer': { "speculate": "3.1.2" },
    'bbc/ibl-variants-api': { "speculate": "3.1.2" },
    'bbc/iplayer-tools': { "speculate": "3.1.2" },
    'bbc/iplayer-tools-credits': { "speculate": "3.1.2" },
    'bbc/iplayer-tools-curator': { "speculate": "3.1.2" },
    'bbc/iplayer-tools-tags': { "speculate": "3.1.2" },
    'bbc/iplayer-tools-variants': { "speculate": "3.1.2" },
});
