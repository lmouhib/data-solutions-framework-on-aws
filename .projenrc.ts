import { LernaProject } from 'lerna-projen';
import { awscdk } from 'projen';
import { DependabotScheduleInterval } from 'projen/lib/github';

const CDK_VERSION = '2.84.0';
const CDK_CONSTRUCTS_VERSION = '10.2.55';
const JSII_VERSION = '~5.0.0';

const repositoryUrl = 'git@github.com:awslabs/aws-data-solutions-framework.git';
const author = 'Amazon Web Services';
const authorAddress = 'https://aws.amazon.com';
const authorOrganization = true;
const license = 'MIT-0';
const copyrightOwner = 'Amazon.com, Inc. or its affiliates. All Rights Reserved.';
const copyrightPeriod = `2021-${new Date().getFullYear()}`;
const defaultReleaseBranch = 'main';
const release = false; /* to update and configure when ready to release */

const rootProject = new LernaProject({
  name: 'aws-data-solutions-framework',
  devDeps: [
    'lerna-projen',
    'ts-node',
    'typescript'
  ],
  peerDeps: [
    '@types/node@^16',
  ],

  defaultReleaseBranch,
  repository: repositoryUrl,
  authorName: author,
  authorUrl: authorAddress,
  authorOrganization,
  license,
  copyrightOwner,
  copyrightPeriod,
  release,

  pullRequestTemplate: false, // define it manually
  githubOptions: {
    workflows: false // define them manually (workflows generated by projen are not secured)
  },
  dependabot: true,
  dependabotOptions: {
    labels: ["npm", "dependencies"],
    scheduleInterval: DependabotScheduleInterval.DAILY,
  },
  packageName: 'aws-data-solutions-framework',

  gitignore: [
    '.idea',
    'dist'
  ],

  projenrcTs: true,

  jest: false
});

new awscdk.AwsCdkConstructLibrary({
  name: 'framework',
  description: 'L3 CDK Constructs used to build data solutions with AWS',

  parent: rootProject,
  outdir: 'framework',
  repositoryDirectory: 'framework',

  defaultReleaseBranch,

  repositoryUrl,
  author,
  authorAddress,
  authorOrganization,
  license,
  copyrightOwner,
  copyrightPeriod,
  release,

  keywords: [
    'aws',
    'constructs',
    'cdk',
    'analytics',
    'database',
    'data'
  ],

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,

  devDeps: [
    'cdk-nag@^2.0.0',
    '@types/jest',
    'jest-runner-groups',
  ],

  jestOptions: {
    jestConfig: {
      runner: 'groups',
    },
  },
});

new awscdk.AwsCdkConstructLibrary({
  name: 'solutions',
  description: 'Pre-packaged data solutions built with the AWS Data Solutions Framework',
  author,
  authorAddress,
  authorOrganization,
  license,

  parent: rootProject,
  outdir: 'solutions',

  keywords: [
    'aws',
    'AWS Service Catalog',
    'cdk',
    'analytics',
    'database',
    'data'
  ],

  repositoryUrl,
  repositoryDirectory: 'solutions',
  defaultReleaseBranch,

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,

  devDeps: [
    '@types/jest',
  ],
  packageName: 'aws-data-solutions',
});

new awscdk.AwsCdkPythonApp({
  name: 'catalog',
  description: 'AWS Service Catalog publishing the AWS Data Solutions',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'catalog',
  moduleName: 'aws_data_solutions_framework',
  
  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  version: '0.0.0'
});


rootProject.synth();