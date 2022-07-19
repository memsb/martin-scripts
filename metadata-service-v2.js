const path = require('path');
const open = require('open');
const chalk = require('chalk');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { reset_dir, has_file, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { get_resources_by_type } = require('./utils/aws.js');
const { sleep } = require('./utils/sleep.js');

const are_tokens_required = async (dir) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/stacks/templates/infrastructure.json');
    const infrastructure = read_json(filename);

    const launch_templates = get_resources_by_type(infrastructure.Resources, 'AWS::EC2::LaunchTemplate');

    if (launch_templates.length > 0) {
        for (component of launch_templates) {
            return infrastructure.Resources[component].Properties.LaunchTemplateData.MetadataOptions.HttpTokens === 'required';
        }
    }
    return false;
}

const update_launch_template = async (dir) => {
    const filename = path.join(dir, '/infrastructure/component.json');
    const infrastructure = read_json(filename);

    const launch_templates = get_resources_by_type(infrastructure.Resources, 'AWS::EC2::LaunchTemplate');

    if (launch_templates.length > 0) {
        for (component of launch_templates) {
            infrastructure.Resources[component].Properties.LaunchTemplateData.MetadataOptions = { 'HttpTokens': 'required' };
        }
        save_json(filename, infrastructure);

        console.log(chalk.green('Updated launch template.'));

        const diff_command = `git diff`
        const diff = await exec(diff_command, { cwd: dir });
    }
}

const convert_to_launch_template = async (dir) => {
    const filename = path.join(dir, '/infrastructure/component.json');
    const infrastructure = read_json(filename);

    const launch_configurations = get_resources_by_type(infrastructure.Resources, 'AWS::AutoScaling::LaunchConfiguration');

    // for (component of launch_configurations) {
    //     console.log(infrastructure.Resources[component].Properties);
    // }

    if (launch_configurations.length > 0) {
        const root = path.dirname(path.dirname(dir));
        const command = `python3 migrateToLaunchTemplate.py --imdsv1 -f ${filename}`
        const res = await exec(command, { cwd: root });
        const infrastructure = JSON.parse(res.stdout);

        save_json(filename, infrastructure);
        console.log(chalk.green('Converted LaunchConfiguration -> LauchTemplate.'));
    }
}




const check = async (repositories) => {
    for await (repository of repositories) {
        console.log(repository);
        try {
            const service = path.basename(repository);
            const dir = path.join(checkout_dir, service);
            
            await checkout(`https://github.com/${repository}`, dir);
            const required = await are_tokens_required(dir);
            console.log(service, required);
        } catch (e) {
            console.log(chalk.red('check failed.'));
            console.log(e);
        }
    }
}

const update = async (repositories) => {
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
            await convert_to_launch_template(dir);
            await update_launch_template(dir);

            await commit(dir, `chore: requiring token validation for aws metadata endpoint`);
            await push(dir);

            const component = path.basename(repository);

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

const checkout_dir = 'update-metadata-service';
reset_dir(checkout_dir);

const optional_in_git = [
    "bbc/ibl-bundles-api",
    "bbc/ibl-edibl",
    "bbc/ibl-episodes-api",
    "bbc/ibl-graph-edge",
    "bbc/ibl-graph-fallbacks-handler",
    "bbc/ibl-graph-resolver",
    "bbc/ibl-nibl",
    "bbc/ibl-user-activity",
    "bbc/ibl-user-play-writer",
  ];

update(optional_in_git)