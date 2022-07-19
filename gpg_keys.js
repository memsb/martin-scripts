const path = require('path');

const { reset_dir, read_json, } = require('./utils/file.js');
const { checkout } = require('./utils/git.js');

const get_repos = (dir) => {
    try {
        const filename = path.join(dir, '/infrastructure/infrastructure/repositories.json');
        return read_json(filename);
    } catch (e) {
        return {}
    }
}

const removeTrailingSlash = (str) => {
    return str.replace(/\/+$/, '');
}

const get_all_tokens = async (components) => {
    const sources = {};

    for (const component of components) {

        const dir = path.join(checkout_dir, component);

        await checkout(`https://github.com/bbc/${component}`, dir);
        const repos = get_repos(dir);

        for (const [key, repo] of Object.entries(repos)) {
            const url = removeTrailingSlash(repo.url)
            if (!(url in sources)) {
                sources[url] = null
            }

            if ('gpg_key' in repo) {
                sources[url] = repo.gpg_key;
            }
        }
    }

    console.log(sources);
};

const checkout_dir = 'add_gpg_tokens';
reset_dir(checkout_dir);

const components = read_json('all-repos.json');
get_all_tokens(components);
