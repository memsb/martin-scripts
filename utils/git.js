const fs = require('fs');
const clone = require('git-clone/promise');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const checkout = async (url, dir) => {
    if (!fs.existsSync(dir)) {
        console.log(`Cloning ${url}`);
        try {
            await clone(url, dir);
        } catch (error) {
            console.log(`Error cloning ${url}`);
        }
    }
}

const commit = async (dir, msg) => {
    const command = `git add . && git commit -m "${msg}" --no-verify`
    await exec(command, { cwd: dir });
}

const push = async (dir) => {
    const command = `git push`
    await exec(command, { cwd: dir });
}

const get_latest_tag = async (dir) => {
    const command = `git describe --tags`
    const tag = await exec(command, { cwd: dir });


    return tag.stdout;
}

const get_release_tag = async (dir) => {
    const tag = await get_latest_tag(dir);
    console.log(tag);
    const regex1 = RegExp('([0-9\.]+)-([0-9]+)', 'g');
    return regex1.exec(tag)[0]
}

module.exports = {
    get_release_tag,
    checkout,
    commit,
    push
}