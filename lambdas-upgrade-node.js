const path = require('path');
const chalk = require('chalk');

const { reset_dir, has_file, read_json, save_json, read, save } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { install, setup, run_tests, install_packages } = require('./utils/npm.js');
const { get_resource_by_type } = require('./utils/aws.js');

const update_nvm_rc = (dir, target_version) => {
    const nvm_rc = path.join(dir, '.nvmrc')
    if (has_file(nvm_rc)) {
        save(nvm_rc, target_version);
    }
}

const update_package_node_version = (dir, target_version) => {
    const package_json = path.join(dir, 'package.json')
    if (has_file(package_json)) {
        const contents = read_json(package_json);
        if ('spec' in contents && 'nodeVersion' in contents.spec) {
            contents.spec.nodeVersion = `>= ${target_version}`
            save_json(package_json, contents);
        }
    }
}

const update_jenkins_pipeline = (dir, major_version) => {
    const jenkins_file = path.join(dir, 'Jenkinsfile')
    if (has_file(jenkins_file)) {
        let contents = read(jenkins_file);
        contents = contents.replace(/Node 12.x/g, `Node ${major_version}.x`);

        save(jenkins_file, contents);
    }
}

const update_infrastructure_component = (dir, major_version) => {
    const component_file = path.join(dir, 'infrastructure/component.json')
    if (has_file(component_file)) {
        let contents = read_json(component_file);

        const lambda_function = get_resource_by_type(contents.Resources, 'AWS::Lambda::Function');
        contents.Resources[lambda_function].Properties.Runtime = `nodejs${major_version}.x`;

        save_json(component_file, contents);
    }
}

const upgrade_node = async (dir, target_version) => {
    const [major, minor, patch] = target_version.split('.');

    update_nvm_rc(dir, target_version);
    update_package_node_version(dir, target_version);
    update_jenkins_pipeline(dir, major);
    update_infrastructure_component(dir, major);

    await install(dir);
    await setup(dir);
    await run_tests(dir);

    await commit(dir, `chore: upgrading to node ${major}`);
}

const update = async (repositories, target_version) => {
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

            await checkout(`https://github.com/bbc/${repository}`, dir);
            await upgrade_node(dir, target_version);

            // await push(dir);

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
}

const checkout_dir = 'lambdas-upgrade-node';
reset_dir(checkout_dir);

update([
    'ibl-snapshots',
    'ibl-popularity-tracker',
    'ibl-credibl-janitor',
    'ibl-popularity-janitor',
    'ibl-passport-gateway',
    'ibl-credibl-retrier',
    'ibl-master-brands-fetcher',
    'ibl-missing-appw-events',
    'ibl-programme-slices-fetcher',
    'ibl-event-list-transformer',
    'ibl-sla-monitor',
    'ibl-video-sitemap-generator',
    'ibl-programme-slice-queue-janitor',
    'ibl-graph-fallbacks-fetcher',
    'ibl-popularity-distributor',
    'ibl-cache-invalidator',
    'ibl-graph-fallbacks-poller'
], 
'14.19.1');