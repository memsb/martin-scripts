const path = require('path');
const chalk = require('chalk');

const { reset_dir, has_file, read, read_json, save, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { ci, setup, run_tests, uses_package, uses_package_dev, update_package, update_package_dev, install, lint_fix } = require('./utils/npm.js');

const set_nvm_rc = (dir, target_version) => {
    const nvm_rc = path.join(dir, '.nvmrc')
    save(nvm_rc, target_version);
}

const update_jenkins_pipeline = (dir, major_version) => {
    const jenkins_file = path.join(dir, 'Jenkinsfile')
    if (has_file(jenkins_file)) {
        let contents = read(jenkins_file);
        contents = contents.replace(/Node 12.x/g, `Node ${major_version}.x`);
        contents = contents.replace(/npm install/g, `npm ci`);

        save(jenkins_file, contents);
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

const update_repositories = (dir, major_version) => {
    const repo_file = path.join(dir, 'infrastructure/infrastructure/repositories.json')
    if (has_file(repo_file)) {
        const contents = read_json(repo_file);
        for (const key in contents) {
            if (contents[key].url.includes('rpm.nodesource.com')) {
                delete contents[key];
                const new_key = `nodejs${major_version}`;
                contents[new_key] = {
                    "url": `https://rpm.nodesource.com/pub_${major_version}.x/el/7/x86_64/`,
                    "type": "direct"
                };
                save_json(repo_file, contents);
            }
        }
    }
}

const upgrade_if_present = async (dir, package, version) => {
    if (await uses_package(dir, package)) {
        await update_package(dir, package, version);
    }
}

const upgrade_if_present_dev = async (dir, package, version) => {
    if (await uses_package_dev(dir, package)) {
        await update_package_dev(dir, package, version);
    }
}

const update_dependencies = async (dir) => {
    await upgrade_if_present(dir, 'pg', '8.7.3');
    // await upgrade_if_present(dir, 'knex', '1.0.7');
    await upgrade_if_present(dir, '@ibl/logger', '5.3.4');
    await upgrade_if_present(dir, '@ibl/stats', '9.2.6');
}

const update_node_repo = (dir, major_version) => {
    const repo_file = path.join(dir, 'repos.d/node.repo')
    if (has_file(repo_file)) {
        save(repo_file, `[repository]
name=nodesource-${major_version}
baseurl=https://rpm.nodesource.com/pub_${major_version}.x/el/7/x86_64/
gpgkey=https://rpm.nodesource.com/pub/el/NODESOURCE-GPG-SIGNING-KEY-EL
enabled=1
gpgcheck=1`);
    }
}

const package_install = async (dir) => {
    const lockfile = path.join(dir, 'package-lock.json')
    if (has_file(lockfile)) {
        try {
            await ci(dir);
        } catch (e) {
            await install(dir);
        }
    } else {
        await install(dir);
    }
}

const fix_linting = async (dir) => {
    try {
        await lint_fix(dir);
    } catch (e) {
        await upgrade_if_present_dev(dir, 'eslint', '8.14.0');
        await upgrade_if_present_dev(dir, 'eslint-config-iplayer-es6', '3.1.1');
        await upgrade_if_present_dev(dir, 'eslint-plugin-mocha', '4.12.1');
        await lint_fix(dir);
    }
}

const upgrade_node = async (dir, target_version) => {
    const [major, minor, patch] = target_version.split('.');

    set_nvm_rc(dir, target_version);
    update_package_node_version(dir, target_version);
    update_repositories(dir, major);
    update_node_repo(dir, major);
    update_jenkins_pipeline(dir, major);

    await package_install(dir);
    await update_dependencies(dir);
    await fix_linting(dir);
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

            await checkout(`https://github.com/${repository}`, dir);
            await upgrade_node(dir, target_version);

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

const checkout_dir = 'services-upgrade-node';
reset_dir(checkout_dir);

update([
    "bbc/ibl-tag-api"
],
    '14.19.1');