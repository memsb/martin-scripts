const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { read_json } = require('./file.js');

const has_script = (script, dir) => {
    const package_json = read_json(dir + '/package.json');

    return 'scripts' in package_json && script in package_json.scripts;
}

const install = async (dir) => {
    let command = 'npm i --prefer-offline --no-audit';
    console.log(command);
    await exec(command, { cwd: dir });
}

const ci = async (dir) => {
    let command = 'npm ci --prefer-offline --no-audit';
    console.log(command);
    await exec(command, { cwd: dir });
}

const uses_package = async (dir, package) => {
    const package_json = read_json(dir + '/package.json');
    return package_json.dependencies.hasOwnProperty(package);
}

const uses_package_dev = async (dir, package) => {
    const package_json = read_json(dir + '/package.json');
    return package_json.devDependencies.hasOwnProperty(package);
}

const update_package = async (dir, package, version) => {
    const command = `npm i ${package}@${version}`;
    console.log(command);
    await exec(command, { cwd: dir });
}

const update_package_dev = async (dir, package, version) => {
    let command;
    if (version) {
         command = `npm i ${package}@${version} --save-dev`;
    } else {
         command = `npm i ${package} --save-dev`;
    }
    console.log(command);
    await exec(command, { cwd: dir });
}

const install_packages = async (dir, packages) => {
    const command = `npm i ${packages.join(' ')}`;
    console.log(command);
    await exec(command, { cwd: dir });
}

const lint_fix = async (dir) => {
    if (has_script('lint', dir)) {
        const command = 'npm run lint -- --fix';
        console.log(command);
        await exec(command, { cwd: dir });
    }
}

const setup = async (dir) => {
    if (has_script('setup', dir)) {
        const command = 'npm run setup';
        console.log(command);
        await exec(command, { cwd: dir });
    }
}

const run_tests = async (dir) => {
    if (has_script('test', dir)) {
        const command = 'npm run test';
        console.log(command);
        try {
            const result = await exec(command, { cwd: dir });
        } catch (e) {
            console.log('Tests failed');
            throw e;
        }
    }
}

module.exports = {
    has_script,
    install,
    ci,
    lint_fix,
    uses_package,
    uses_package_dev,
    update_package,
    update_package_dev,
    install_packages,
    setup,
    run_tests
}