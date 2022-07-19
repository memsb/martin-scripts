import json
import argparse
import sys

def check_required_parameters(requiredParameters, template):
    for requiredParameter in requiredParameters:
        if requiredParameter not in template.get('Parameters', []):
            return False, f'Required parameter {requiredParameter} not in the provided template. Aborting.'
    if not template.get('Parameters', []):
        return False, 'There are no parameters in the stack. Aborting.'
    return True, 'All required parameters found'

def check_required_resources(requiredResources, template):
    for requiredResource in requiredResources:
        if requiredResource not in template.get('Resources', []):
            return False, f'Required resource {requiredResource} not in the provided template. Aborting.'
    if not template.get('Resources', []):
        return False, 'There are no resources in the stack. Aborting.'
    return True, 'All required resources found'

def add_default_security_groups(securityGroups):
    defaultSecurityGroups = [
        {
            'Fn::ImportValue': 'core-infrastructure-SSHFromBastionsSecGroup'
        },
        {
            'Ref': 'ComponentSecurityGroup'
        }
    ]
    securityGroups = list(securityGroups)
    securityGroups.extend(x for x in defaultSecurityGroups if x not in securityGroups)
    return securityGroups

def convert_block_mappings(blockDeviceMappings):
    mapped = []
    for mapping in blockDeviceMappings:
        mapped.append({
            'DeviceName': mapping['DeviceName'],
            'Ebs':  mapping['Ebs']
        })

    return mapped

def add_launch_template(imdsv1=False, securityGroups = [], hasDetailedMonitoring=False, blockDeviceMappings=False):
    template = {
        'Type': 'AWS::EC2::LaunchTemplate',
        'Properties': {
            "LaunchTemplateName": {
                "Fn::Join": [
                    "-",
                    [
                        {
                            "Ref": "ComponentName"
                        },
                        "LaunchTemplate",
                        {
                            "Ref": "Environment"
                        }
                    ]
                ]
            },
            'LaunchTemplateData': {
                'IamInstanceProfile': {
                    'Arn': {
                        'Fn::GetAtt': [
                            'ComponentInstanceProfile',
                            'Arn'
                        ]
                    }
                },
                'ImageId': {
                    'Ref': 'ImageId'
                },
                'InstanceType': {
                    'Ref': 'InstanceType'
                },
                'KeyName': {
                    'Ref': 'KeyName'
                },
                'MetadataOptions': {
                    'HttpTokens': 'required' if imdsv1 == False else 'optional'
                },
                'Monitoring': {
                    'Enabled': hasDetailedMonitoring
                },
                'SecurityGroupIds': add_default_security_groups(securityGroups)
            }
        }
    }

    if blockDeviceMappings :
        template['Properties']['LaunchTemplateData']['BlockDeviceMappings'] = convert_block_mappings(blockDeviceMappings)

    return template

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Migrate a CloudFormation template from using an Autoscaling Launch Configuration to an EC2 Launch Template.')
    parser.add_argument('-f', '--file', help='Path to the CloudFormation template to parse', required=True)
    parser.add_argument('-1', '--imdsv1', help='Allow IMDSv1 requests (not recommended)', default=False, action='store_true')

    args = parser.parse_args()

    template = {}

    with open(args.file) as f:
        template = json.loads(f.read())

    resources = template.get('Resources', {})

    launchConfigurationLogicalId = None
    autoscalingGroupLogicalId = None

    # Find the Launch Configuration and Autoscaling Group resources
    for resourceName in resources:
        resource = resources.get(resourceName, {})
        if resource:
            if resource.get('Type', '') == 'AWS::AutoScaling::LaunchConfiguration':
                if not launchConfigurationLogicalId:
                    launchConfigurationLogicalId = resourceName
                else:
                    print('Found more than one AWS::AutoScaling::LaunchConfiguration in the provided template. This script can only handle one AWS::AutoScaling::LaunchConfiguration per template. Aborting.')
            if resource.get('Type', '') == 'AWS::AutoScaling::AutoScalingGroup':
                if resource.get('Properties', {}).get('LaunchConfigurationName', {}):
                    autoscalingGroupLogicalId = resourceName

    # Check that we've found an Launch Configuration
    if not launchConfigurationLogicalId:
        print('Failed to find an AWS::AutoScaling::LaunchConfiguration in the provided template. This script is designed to replace Autoscaling Launch Configurations with EC2 Launch Templates. Aborting.')
        sys.exit(1)
    
    # Check that we've found an Autoscaling Group
    if not autoscalingGroupLogicalId:
        print('Failed to find an AWS::AutoScaling::AutoScalingGroup which references a Launch Configuration in the provided template. Aborting.')
        sys.exit(1)

    # Check the required parameters (for the EC2 Launch template that we are going to insert) exist
    paramCheckResult = check_required_parameters(['InstanceType', 'ImageId', 'KeyName'], template)
    if not paramCheckResult[0]:
        print(paramCheckResult[1])
        sys.exit(1)
    
    # Check the required resources (for the EC2 Launch template that we are going to insert) exist
    resourceCheckResult = check_required_resources(['ComponentInstanceProfile', 'ComponentSecurityGroup'], template)
    if not resourceCheckResult[0]:
        print(resourceCheckResult[1])
        sys.exit(1)

    hasDetailedMonitoring = resources[launchConfigurationLogicalId]['Properties'].get('InstanceMonitoring', True)
    blockDeviceMappings = resources[launchConfigurationLogicalId]['Properties'].get('BlockDeviceMappings', False)
    securityGroups = resources[launchConfigurationLogicalId]['Properties']['SecurityGroups']

    del resources[launchConfigurationLogicalId] # Remove the launch configuration
    del resources[autoscalingGroupLogicalId]['Properties']['LaunchConfigurationName'] # Remove reference to the launch configuration

    # Add a new launch template in
    resources['ComponentLaunchTemplate'] = add_launch_template(args.imdsv1, securityGroups, hasDetailedMonitoring, blockDeviceMappings)

    # Reference the launch template from the autoscaling group
    resources[autoscalingGroupLogicalId]['Properties']['LaunchTemplate'] = {
        'LaunchTemplateId': {
            'Ref': 'ComponentLaunchTemplate'
        },
        'Version': {
            'Fn::GetAtt': [
                'ComponentLaunchTemplate',
                'LatestVersionNumber'
            ]
        }
    }

    print(json.dumps(template, indent=4, sort_keys=True))