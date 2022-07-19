const fs = require('fs');

const ensure_dir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

const reset_dir = (dir) => {
    if (fs.existsSync(dir)) {
        fs.rmdirSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir);
}

const has_file = (filename) => fs.existsSync(filename);

const remove = (filename) => fs.rmSync(filename, { recursive: true, force: true });

const read_json = (filename) => JSON.parse(read(filename));

const save_json = (filename, data) => save(filename, JSON.stringify(data, null, 2));

const read = (filename) => fs.readFileSync(filename, 'utf8');

const save = (filename, contents) => fs.writeFileSync(filename, contents);


module.exports = {
    ensure_dir,
    reset_dir,
    has_file,
    remove,
    read_json,
    save_json,
    read,
    save
}