const path = require('path');
const chalk = require('chalk');

const { reset_dir, read_json, save_json } = require('./utils/file.js');
const { checkout, commit, push } = require('./utils/git.js');
const { get_load_balancer_components, get_resources_by_type } = require('./utils/aws.js');


// stacks have multiple elbs
const enable_connection_draining = async (dir) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/stacks/templates/infrastructure.json');
    const infrastructure = read_json(filename);

    const elbs = get_resources_by_type(infrastructure.Resources, 'AWS::ElasticLoadBalancing::LoadBalancer');

    elbs.forEach(elb => {
        if (!('ConnectionDrainingPolicy' in infrastructure.Resources[elb].Properties)) {
            infrastructure.Resources[elb].Properties.ConnectionDrainingPolicy = {
                "Enabled": true,
                "Timeout": 20
            };
        }
    });

    save_json(filename, infrastructure);
}

const add_new_load_balancer = (dir) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/stacks/templates/infrastructure.json');
    const infrastructure = read_json(filename);

    const elbs = get_resources_by_type(infrastructure.Resources, 'AWS::ElasticLoadBalancing::LoadBalancer');

    elbs.forEach(elb => {
        console.log(elb);
        const scheme = infrastructure.Resources[elb].Scheme === "internal" ? 'internal' : 'component';
        const new_elb = scheme + 'LoadBalancer';
        Object.assign(infrastructure.Resources[new_elb], infrastructure.Resources[elb]);

        infrastructure.Resources[new_elb].Properties.LoadBalancerName = {
            "Fn::Join": [
                "-",
                [
                    {
                        "Ref": "ComponentName"
                    },
                    scheme,
                    'elb',
                    {
                        "Ref": "Environment"
                    }
                ]
            ]
        }
    });

    save_json(filename, infrastructure);
};

const update_dns_record = (dir) => {
    const filename = path.join(dir, '/infrastructure/infrastructure/stacks/templates/infrastructure.json');
    const infrastructure = read_json(filename);

    const record_sets = get_resources_by_type(infrastructure.Resources, 'AWS::Route53::RecordSet');

    record_sets.forEach(record_set => {
        console.log(record_set);
        infrastructure.Resources[record_set].Properties.ResourceRecords = {
            "Fn::Join": [
                "-",
                [
                    {
                        "Ref": "ComponentName"
                    },
                    {
                        "Ref": "Environment"
                    },
                    scheme
                ]
            ]
        }
    });

    save_json(filename, infrastructure);
};
const remove_old_balancer = () => { };

const update_stacks = async () => {
    const components = await get_load_balancer_components();

    const successful = [];
    const failed = [];
    for (component of components) {
        console.log(component);

        const dir = path.join(checkout_dir, path.basename(component));

        try {
            await checkout(`https://github.com/bbc/${component}`, dir);
            // await enable_connection_draining(dir);
            await add_new_load_balancer(dir);
            // await commit(dir, 'chore: set load balancer name, enable connection draining');
            //   await push(dir);
            console.log(chalk.green('Updated'));
            successful.push(component);
        } catch (e) {
            console.log(e)
            console.log(chalk.red('Failed'));
            failed.push(component);
        }
    }

    console.log(chalk.green(successful));
    console.log(chalk.red(failed));
}

const checkout_dir = 'enable_connection_draining';

reset_dir(checkout_dir);
update_stacks();