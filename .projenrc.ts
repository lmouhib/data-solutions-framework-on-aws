import { LernaProject } from 'lerna-projen';
import { awscdk } from 'projen';
import { DependabotScheduleInterval } from 'projen/lib/github';
import { Transform } from "projen/lib/javascript";

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
const name = 'aws-data-solutions-framework';
const shortName = 'adsf';
const keywords= [
  'awscdk',
  'aws',
  'cdk',
  'constructs',
  'analytics',
  'datalake',
  'data'
];

const rootProject = new LernaProject({
  name,
  devDeps: [
    'lerna-projen',
    'ts-node',
    'typescript',
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
  packageName: `@${shortName}/${name}`,

  gitignore: [
    '.idea',
    'dist'
  ],

  projenrcTs: true,

  jest: false
});

const fwkProject = new awscdk.AwsCdkConstructLibrary({
  name: 'framework',
  description: 'L3 CDK Constructs used to build data solutions with AWS',
  packageName: `@${shortName}/framework`,
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

  keywords,

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,

  publishToPypi: {
    distName: 'adsf',
    module: 'adsf'
  },

  devDeps: [
    'cdk-nag@^2.0.0',
    '@types/jest',
    '@jest/globals',
    'ts-jest',
    'jest-runner-groups',
    `@aws-cdk/cli-lib-alpha@${CDK_VERSION}-alpha.0`,
    'rosetta',
  ],

  python: {
    distName: 'adsf',
    module: 'adsf',
  },

  jestOptions: {
    jestConfig: {
      runner: 'groups',
      transform: {
        '^.+\\.ts?$': new Transform('ts-jest', {
          tsconfig: 'tsconfig.dev.json',
        }),
      },
      globals: {
        'ts-jest': null // remove jest deprecation warning caused by projen-generated default config
      }
    }
  },

  tsconfig: {
    compilerOptions: {
      lib: [
        "ES2021"
      ],
      target: "ES2021"
    }
  },
});

fwkProject.setScript('test', 'npx projen test --group=-e2e');

fwkProject.addTask('test:e2e', {
  description: 'Run framework end-to-end tests',
  exec: 'npx projen test --group=e2e'
});

new awscdk.AwsCdkConstructLibrary({
  name: 'solutions',
  packageName: `@${shortName}/solutions`,
  description: 'Pre-packaged data solutions built with the AWS Data Solutions Framework (@adsf/framework)',
  author,
  authorAddress,
  authorOrganization,
  license,

  parent: rootProject,
  outdir: 'solutions',

  keywords,

  repositoryUrl,
  repositoryDirectory: 'solutions',
  defaultReleaseBranch,

  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  jsiiVersion: JSII_VERSION,

  devDeps: [
    '@types/jest',
  ],
});

const exampleApp = new awscdk.AwsCdkPythonApp({
  name: 'example',
  moduleName: 'adsf_example',
  packageName: 'adsf_example',
  version: '0.0.1',
  description: 'An example CDK app demonstrating the most common use cases for AWS Data Solutions Framework',
  authorName: author,
  authorEmail: authorAddress,
  license,

  parent: rootProject,
  outdir: 'example',
 
  cdkVersion: CDK_VERSION,
  constructsVersion: CDK_CONSTRUCTS_VERSION,
  cdkVersionPinning: true,
  
  pytest: true,
  devDeps: [
    "pytest",
  ],

  venvOptions: {
    envdir: '.venv'
  },
});

exampleApp.removeTask('deploy');
exampleApp.removeTask('destroy');
exampleApp.removeTask('diff');
exampleApp.removeTask('watch');
exampleApp.removeTask('synth');
exampleApp.testTask.reset();
exampleApp.postCompileTask.reset();
exampleApp.addTask('test:unit', {
  description: 'Run unit tests',
  exec: 'pytest -k "not e2e"'
});
exampleApp.addTask('test:e2e', {
  description: 'Run end-to-end tests',
  exec: 'pytest -k e2e'
});
const synthTask = exampleApp.tasks.tryFind('synth:silent');
synthTask?.reset();
synthTask?.exec(`npx -y cdk@${CDK_VERSION} synth -q`);
const buildExampleTask = exampleApp.addTask('build-example', {
  steps: [
    { exec: `pip install --no-index --find-links ./dist/python adsf` },
    { spawn: 'synth:silent' },
    { spawn: 'test:unit' },
  ]
});
exampleApp.packageTask.spawn(buildExampleTask);

rootProject.addTask('test:e2e', {
  description: 'Run end-to-end tests'
});

rootProject.synth();