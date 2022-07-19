const path = require('path');
const chalk = require('chalk');

const { reset_dir, has_file, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { get_asg_components, get_resource_by_type } = require('./utils/aws.js');


const update_stack = (filename) => {
  const infrastructure = read_json(filename);
  const asg = get_resource_by_type(infrastructure.Resources, 'AWS::AutoScaling::AutoScalingGroup');
  infrastructure.Resources[asg].Properties.HealthCheckType = 'ELB';
  infrastructure.Resources[asg].Properties.HealthCheckGracePeriod = 180;
  save_json(filename, infrastructure);
}

const enable_elb_health_check = async (dir) => {
  const infrastructure = path.join(dir, 'infrastructure/infrastructure/stacks/templates/infrastructure.json');

  if (has_file(infrastructure)) {
    update_stack(infrastructure);
  }

  const component = path.join(dir, 'infrastructure/component.json');
  if (has_file(component)) {
    update_stack(component);
  }
}

const update_stacks = async () => {
  const components = await get_asg_components();

  console.log(components);

  // for (component of components) {
  //   const dir = path.join(checkout_dir, path.basename(component));

  //   try {
  //     await checkout(`https://github.com/bbc/${component}`, dir);
  //     await enable_elb_health_check(dir);
  //     await commit(dir, 'fix: add elb health check');
  //     await push(dir);
  //     console.log(chalk.green('Updated'));
  //   } catch (e) {
  //     console.log(e)
  //     console.log(chalk.red('Failed'));
  //   }
  // }
}

const checkout_dir = 'enable_elb_health_checks';

reset_dir(checkout_dir);
update_stacks();


