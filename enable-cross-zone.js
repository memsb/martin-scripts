const path = require('path');
const chalk = require('chalk');

const { reset_dir, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { get_load_balancer_components, get_resource_by_type } = require('./utils/aws.js');

const enable_cross_zone = async (dir) => {
  const filename = path.join(dir, '/infrastructure/infrastructure/stacks/templates/infrastructure.json');
  const infrastructure = read_json(filename);

  const elb = get_resource_by_type(infrastructure.Resources, 'AWS::ElasticLoadBalancing::LoadBalancer');

  infrastructure.Resources[elb].Properties.CrossZone = true;

  save_json(filename, infrastructure);
}

const update_stacks = async () => {
  const components = await get_load_balancer_components();

  for (component of components) {
    console.log(component);

    const dir = path.join(checkout_dir, path.basename(component));

    try {
      await checkout(`https://github.com/bbc/${component}`, dir);
      await enable_cross_zone(dir);
      await commit(dir, 'fix: add cross zone load balancing');
      await push(dir);
      console.log(chalk.green('Updated'));
    } catch (e) {
      console.log(e)
      console.log(chalk.red('Failed'));
    }
  }
}

const checkout_dir = 'enable_cross_zone';

reset_dir(checkout_dir);
update_stacks();