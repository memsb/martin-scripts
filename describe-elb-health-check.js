const {
    ElasticLoadBalancingClient,
    DescribeLoadBalancersCommand,
    DescribeLoadBalancerAttributesCommand,
    DescribeTagsCommand: DescribeElbTagsCommand
} = require("@aws-sdk/client-elastic-load-balancing");


const get_elb_health_checks = async () => {
    const components = [];
    const client = new ElasticLoadBalancingClient({ region: "eu-west-1" });

    const get_elbs_command = new DescribeLoadBalancersCommand({});
    const elbs = await client.send(get_elbs_command);

    for await (lb of elbs.LoadBalancerDescriptions) {
        const get_tags_command = new DescribeElbTagsCommand({ LoadBalancerNames: [lb.LoadBalancerName] });
        const elb_tags = await client.send(get_tags_command);

        const component_tag = elb_tags.TagDescriptions[0].Tags.filter((tag) => tag.Key === 'Component')[0];
        if ('Value' in component_tag) {
            console.log(component_tag.Value);
        }
        // console.log(lb.HealthCheck);
    };
};


get_elb_health_checks();