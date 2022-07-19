const {
    ElasticLoadBalancingClient,
    DescribeLoadBalancersCommand,
    DescribeLoadBalancerAttributesCommand,
    DescribeTagsCommand: DescribeElbTagsCommand
} = require("@aws-sdk/client-elastic-load-balancing");

const {
    AutoScalingClient,
    DescribeAutoScalingGroupsCommand,
    DescribeTagsCommand: DescribeAsgTagsCommand
} = require("@aws-sdk/client-auto-scaling");

const { LambdaClient, ListFunctionsCommand } = require("@aws-sdk/client-lambda")


const list_functions = async () => {
    const client = new LambdaClient({ region: "eu-west-1" });

    const input = NextToken ? { NextToken } : {};
    const command = new ListFunctionsCommand(input);
    const response = await client.send(command);
    let functions = response.Functions;

    if (response.NextToken) {
        functions = functions.concat(await list_functions(response.NextToken));
    }

    return functions;
}


const get_asgs = async (NextToken) => {
    const client = new AutoScalingClient({ region: "eu-west-1" });
    const input = NextToken ? { NextToken } : {};
    const command = new DescribeAutoScalingGroupsCommand(input);
    const response = await client.send(command);
    let asgs = response.AutoScalingGroups;

    if (response.NextToken) {
        asgs = asgs.concat(await get_asgs(response.NextToken));
    }

    return asgs;
}

const get_asg_components = async () => {
    const client = new AutoScalingClient({ region: "eu-west-1" });

    const asgs = await get_asgs();

    const components = [];
    for await (asg of asgs) {
        if (asg.HealthCheckType === 'EC2') {
            const get_tags_command = new DescribeAsgTagsCommand({ Filters: [{ Name: 'auto-scaling-group', Values: [asg.AutoScalingGroupName] }] });
            const asg_tags = await client.send(get_tags_command);

            const component_tag = asg_tags.Tags.filter((tag) => tag.Key === 'Component')[0];
            components.push(component_tag.Value);
        }
    }

    return components;
}

const get_load_balancer_components = async () => {
    const components = new Set();
    const client = new ElasticLoadBalancingClient({ region: "eu-west-1" });

    const get_elbs_command = new DescribeLoadBalancersCommand({});
    const elbs = await client.send(get_elbs_command);

    for await (lb of elbs.LoadBalancerDescriptions) {
        const get_tags_command = new DescribeElbTagsCommand({ LoadBalancerNames: [lb.LoadBalancerName] });
        const elb_tags = await client.send(get_tags_command);

        const component_tag = elb_tags.TagDescriptions[0].Tags.filter((tag) => tag.Key === 'Component')[0];
        if (component_tag) {
            console.log(component_tag.Value);
            components.add(component_tag.Value);
        }
    };

    return Array.from(components);
}

const get_load_balancer_components_without_connection_draining = async () => {
    const components = new Set();
    const client = new ElasticLoadBalancingClient({ region: "eu-west-1" });

    const get_elbs_command = new DescribeLoadBalancersCommand({});
    const elbs = await client.send(get_elbs_command);

    for await (lb of elbs.LoadBalancerDescriptions) {
        const get_elb_attributes_command = new DescribeLoadBalancerAttributesCommand({ LoadBalancerName: lb.LoadBalancerName });
        const elb_atts = await client.send(get_elb_attributes_command);
        // if (elb_atts.LoadBalancerAttributes.ConnectionDraining.Enabled === false) {
        const get_tags_command = new DescribeElbTagsCommand({ LoadBalancerNames: [lb.LoadBalancerName] });
        const elb_tags = await client.send(get_tags_command);

        const component_tag = elb_tags.TagDescriptions[0].Tags.filter((tag) => tag.Key === 'Component')[0];
        components.add(component_tag.Value);
        console.log(elb_atts.LoadBalancerAttributes.ConnectionDraining.Enabled);
        // }
    };

    return Array.from(components);
}

const get_resource_by_type = (resources, type) => Object.entries(resources).reduce(
    (previous, [component, resource]) => resource.Type === type ? component : previous
);

const get_resources_by_type = (resources, type) => Object.entries(resources).reduce(
    (found, [component, resource]) => {
        if (resource.Type === type) {
            found.push(component);
        }
        return found;
    },
    []
);

module.exports = {
    list_functions,
    get_load_balancer_components,
    get_load_balancer_components_without_connection_draining,
    get_asg_components,
    get_resource_by_type,
    get_resources_by_type
}