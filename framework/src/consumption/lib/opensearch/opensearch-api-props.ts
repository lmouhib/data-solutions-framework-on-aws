// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RemovalPolicy } from 'aws-cdk-lib';
import { IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';

/**
 * Configuration for the OpenSearch API.
 */
export interface OpenSearchApiProps {

  /**
   * The removal policy when deleting the CDK resource.
   * If DESTROY is selected, context value `@data-solutions-framework-on-aws/removeDataOnDestroy` needs to be set to true.
   * Otherwise the removalPolicy is reverted to RETAIN.
   * @default - The resources are not deleted (`RemovalPolicy.RETAIN`).
   */
  readonly removalPolicy?: RemovalPolicy;

  /**
   * The IAM role to pass to IAM authentication lambda handler
   * This role must be able to be assumed with `lambda.amazonaws.com` service principal
   * @default - new IAMRole is created.
   */
  readonly iamHandlerRole?: IRole;

  /**
   * Defines the virtual networking environment for this construct.
   * Typically should use same VPC as OpenSearch cluster or serverless collection.
   * Must have at least 2 subnets in two different AZs.
   * @default - no VPC is used.
   */
  readonly vpc?: IVpc;

  /**
   * The subnets where the Custom Resource Lambda Function would be created in.
   * Required if vpc parameter is provided.
   * @default - One private subnet with egress is used per AZ.
   */
  readonly subnets?: SubnetSelection;

  /**
   * The OpenSearch Cluster or Serverless collection endpoint to connect to.
   * if you provisoned your cluster using CDK
   * use domainEndpoint property of OpenSearch provisioned cluster or
   * attrCollectionEndpoint property of OpenSearch Serverless collection.
   */
  readonly openSearchEndpoint : string;

  /**
   * Type of OpenSearch cluster.
   */
  readonly openSearchClusterType : OpenSearchClusterType;

  /**
   * AWS Region openSearchEndpoint is provisioned in.
   * @default - same region as stack.
   */
  readonly openSearchEndpointRegion? : string;
}


export enum OpenSearchClusterType {
  PROVISIONED = 'provisioned',
  SERVERLESS = 'serverless'
}