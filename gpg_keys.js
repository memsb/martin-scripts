const path = require('path');

const { reset_dir, read_json, has_file} = require('./utils/file.js');
const { checkout } = require('./utils/git.js');

const get_repos = (dir) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/repositories.json');
    return read_json(filename);
}

const removeTrailingSlash = (str) => {
    return str.replace(/\/+$/, '');
}

const get_all_tokens = async (components) => {
    const sources = {};
    const has_repos = [];

    for (const component of components) {

        const dir = path.join(checkout_dir, component);

        await checkout(`https://github.com/bbc/${component}`, dir);
  
        const filename = path.join(dir, '/infrastructure/infrastructure/repositories.json');
console.log(filename);
console.log(has_file(filename));
        if(has_file(filename)){
            has_repos.push(component);
        }

        // for (const [key, repo] of Object.entries(repos)) {
        //     const url = removeTrailingSlash(repo.url)
        //     if (!(url in sources)) {
        //         sources[url] = null
        //     }

        //     if ('gpg_key' in repo) {
        //         sources[url] = repo.gpg_key;
        //     }
        // }
    }

    console.log(has_repos);
};

const checkout_dir = 'add_gpg_tokens';
// reset_dir(checkout_dir);

const components = read_json('components-with-gpg-keys.json');
get_all_tokens(components);
