const path = require('path');

const { reset_dir, read_json, has_file, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');

const get_repos = (dir) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/repositories.json');
    return read_json(filename);
}

const removeTrailingSlash = (str) => {
    return str.replace(/\/+$/, '');
}

const add_missing_keys = (dir, mapping) => {
    let key_added = false;
    const filename = path.join(dir, '/infrastructure/infrastructure/repositories.json');
    if (has_file(filename)) {
        const repos = read_json(filename);

        for (const [key, repo] of Object.entries(repos)) {
            if (!('gpg_key' in repo)) {
                const url = removeTrailingSlash(repo.url)

                if (url in mapping && mapping[url] !== null) {
                    console.log(key);
                    repo.gpg_key = mapping[url];
                    key_added = true;
                }
            }
        }

        if (key_added) {
            save_json(filename, repos);
        }
    }
    return key_added;
}

const add_tokens = async (components, mapping) => {
    for (const component of components) {
        const dir = path.join(checkout_dir, component);

        await checkout(`https://github.com/bbc/${component}`, dir);

        let updated = add_missing_keys(dir, mapping);
        if (updated) {
            console.log(`GPG keys added to: ${component}`);
            // await commit(dir, 'chore: add GPG keys');
            // await push(dir);
        } else {
            console.log(`skipping: ${component}`);
        }
        console.log('\n');
    }
};

const checkout_dir = 'add_gpg_tokens';
reset_dir(checkout_dir);

const components = read_json('components-with-gpg-keys.json');
const mapping = require('./key_mappings');

add_tokens(components, mapping);
