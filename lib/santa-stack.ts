import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class SantaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table for participants
    const participantsTable = new dynamodb.Table(this, 'ParticipantsTable', {
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'SecretSantaTopic', {
      displayName: 'Secret Santa Notifications',
    });

    // S3 bucket for frontend
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });


    // Lambda environment variables
    const lambdaEnv = {
      TABLE_NAME: participantsTable.tableName,
      SNS_TOPIC_ARN: notificationTopic.topicArn,
    };

    // Register Lambda
    const registerLambda = new lambda.Function(this, 'RegisterLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/register')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
    });

    // List Lambda
    const listLambda = new lambda.Function(this, 'ListLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/list')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
    });

    // Remove Lambda
    const removeLambda = new lambda.Function(this, 'RemoveLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/remove')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
    });

    // Randomize Lambda
    const randomizeLambda = new lambda.Function(this, 'RandomizeLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/randomize')),
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(30),
    });

    // Grant permissions
    participantsTable.grantReadWriteData(registerLambda);
    participantsTable.grantReadData(listLambda);
    participantsTable.grantReadWriteData(removeLambda);
    participantsTable.grantReadData(randomizeLambda);
    notificationTopic.grantPublish(randomizeLambda);
    notificationTopic.grantSubscribe(registerLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'SecretSantaApi', {
      restApiName: 'Secret Santa API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type'],
      },
    });

    const participants = api.root.addResource('participants');
    participants.addMethod('POST', new apigateway.LambdaIntegration(registerLambda));
    participants.addMethod('GET', new apigateway.LambdaIntegration(listLambda));

    const participant = participants.addResource('{email}');
    participant.addMethod('DELETE', new apigateway.LambdaIntegration(removeLambda));

    const randomize = api.root.addResource('randomize');
    randomize.addMethod('POST', new apigateway.LambdaIntegration(randomizeLambda));

    // Deploy frontend with auto-injected API URL
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../frontend')),
        // Inject config.js with API URL at deploy time
        s3deploy.Source.jsonData('config.js', {
          __comment: 'Auto-generated - do not edit',
        }),
        s3deploy.Source.data('config.js', `window.API_URL = '${api.url}';`),
      ],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'Secret Santa Website URL',
    });

    new cdk.CfnOutput(this, 'ApiURL', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
