const path = require('path');
const chalk = require('chalk');

const { reset_dir, has_file, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { get_resources_by_type } = require('./utils/aws.js');


const update_stack = (filename, target_version) => {
  const infrastructure = read_json(filename);
  const resources = get_resources_by_type(infrastructure.Resources, 'AWS::RDS::DBInstance');
  resources.forEach(resource => {
      infrastructure.Resources[resource].Properties.EngineVersion = target_version;
  });

  save_json(filename, infrastructure);
}

const update_db_engine_version = async (dir, target_version) => {
  const infrastructure = path.join(dir, 'infrastructure/infrastructure/stacks/templates/database.json');

  if (has_file(infrastructure)) {
    update_stack(infrastructure, target_version);
  }
}

const update_stacks = async (components, target_version) => {
  for (component of components) {
    const dir = path.join(checkout_dir, path.basename(component));

    try {
      await checkout(`https://github.com/bbc/${component}`, dir);
      await update_db_engine_version(dir, target_version);
      await commit(dir, 'chore: update database engine version');
      await push(dir);
      console.log(chalk.green('Updated'));
    } catch (e) {
      console.log(e)
      console.log(chalk.red('Failed'));
    }
  }
}

const checkout_dir = 'database-upgrade';

reset_dir(checkout_dir);
update_stacks([
    "ibl-metadata-errors-api",
    "ibl-slices-api",
    "ibl-episodes-api",
    "ibl-credibl-api",
    "ibl-tag-api",
    "ibl-programmes-api",
    "ibl-variants-api"
], "12.10");


