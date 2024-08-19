/**
    * Testing my changes
    *
    * @group e2e/mytests
    */

import * as cdk from 'aws-cdk-lib';
import { CfnProject, CfnProjectMembership } from 'aws-cdk-lib/aws-datazone';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { CompositePrincipal, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { TestStack } from './test-stack';
import { DataZoneCustomAssetTypeFactory, DataZoneMskAssetType, DataZoneMskCentralAuthorizer, DataZoneMskEnvironmentAuthorizer } from '../../src/governance';
import { createSubscriptionTarget } from '../../src/governance/lib/datazone/datazone-helpers';
import { KafkaClientLogLevel, MskServerless } from '../../src/streaming';
import { DataVpc, Utils } from '../../src/utils';

jest.setTimeout(10000000);

// GIVEN
const app = new cdk.App();
const stack = new cdk.Stack(app, 'E2eStack');
const testStack = new TestStack('E2eTestStack', app, stack);

stack.node.setContext('@data-solutions-framework-on-aws/removeDataOnDestroy', true);

const DOMAIN_ID = 'dzd_dc495t9ime7von';

const mskAuthorizer = new DataZoneMskCentralAuthorizer(testStack.stack, 'MskAuthorizer', {
  domainId: 'dzd_dc495t9ime7von',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

let vpc = new DataVpc(stack, 'vpc', {
  vpcCidr: '10.0.0.0/16',
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

let securityGroup = SecurityGroup.fromSecurityGroupId(stack, 'securityGroup', vpc.vpc.vpcDefaultSecurityGroup);

const msk = new MskServerless(stack, 'cluster', {
  clusterName: `cluster-serverless${Utils.generateHash(stack.stackName).slice(0, 3)}`,
  vpc: vpc.vpc,
  subnets: vpc.vpc.selectSubnets(),
  securityGroups: [securityGroup],
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  kafkaClientLogLevel: KafkaClientLogLevel.DEBUG,
});

const consumerRole = new Role(stack, 'consumerRole', {
  assumedBy: new CompositePrincipal(
    new ServicePrincipal('datazone.amazonaws.com'),
    new ServicePrincipal('lambda.amazonaws.com'),
  ),
});

msk.addTopic('topicServerelss', {
  topic: 'dummy',
  numPartitions: 1,
}, cdk.RemovalPolicy.DESTROY, false, 1500);

new DataZoneMskEnvironmentAuthorizer(stack, 'MskEnvAuthorizer', {
  domainId: DOMAIN_ID,
  centralAuthorizerStateMachine: mskAuthorizer.stateMachine,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

mskAuthorizer.registerAccount(cdk.Stack.of(stack).account);

const cfnProject = new CfnProject(stack, 'MyCfnProject', {
  domainIdentifier: DOMAIN_ID,
  description: 'MSK Project',
  name: 'MSK',
});

new CfnProjectMembership(stack, 'ProjectMembership', {
  designation: 'PROJECT_CONTRIBUTOR',
  domainIdentifier: DOMAIN_ID,
  projectIdentifier: cfnProject.attrId,
  member: {
    userIdentifier: 'arn:aws:iam::632368511077:role/gromav',
  },
});

const assetFactory = new DataZoneCustomAssetTypeFactory(stack, 'AssetTypeFactory', { removalPolicy: cdk.RemovalPolicy.DESTROY });

const mskAssetType = new DataZoneMskAssetType(stack, 'MskAssetType', {
  domainId: DOMAIN_ID,
  projectId: cfnProject.attrId,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  dzCustomAssetTypeFactory: assetFactory,
});

createSubscriptionTarget(stack, 'Consumer',
  mskAssetType.mskCustomAssetType,
  'testSubscription',
  'dsf',
  'cuym174roc3d47',
  [consumerRole],
  assetFactory.createRole,
);

new cdk.CfnOutput(stack, 'MyOutput', {
  value: 'test',
});


let deployResult: Record<string, string>;


beforeAll(async() => {
  // WHEN
  deployResult = await testStack.deploy();

}, 10000000);

it('mytest', async () => {
  // THEN
  expect(deployResult.MyOutput).toContain('test');
});
