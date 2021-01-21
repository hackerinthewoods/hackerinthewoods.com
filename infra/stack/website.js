const { join } = require("path");
const { Stack, Duration } = require("@aws-cdk/core");

const {
  PublicHostedZone,
  RecordTarget,
  ARecord,
} = require("@aws-cdk/aws-route53");

const { CloudFrontTarget } = require("@aws-cdk/aws-route53-targets");

const {
  PriceClass,
  CloudFrontWebDistribution,
  OriginProtocolPolicy,
} = require("@aws-cdk/aws-cloudfront");

const {
  Bucket,
  BucketAccessControl,
  RedirectProtocol,
} = require("@aws-cdk/aws-s3");

const {
  BucketDeployment,
  Source,
  CacheControl,
} = require("@aws-cdk/aws-s3-deployment");

class WebsiteStack extends Stack {
  constructor(app, id, props) {
    super(app, id, props);

    const hostName = this.node.tryGetContext("hostName");
    const certificateArn = this.node.tryGetContext("certificateArn");
    const { hostedZoneId, zoneName } = this.node.tryGetContext("zone");

    const zone = PublicHostedZone.fromHostedZoneAttributes(this, "route-53", {
      hostedZoneId,
      zoneName,
    });

    const websiteAssets = new Bucket(this, `${id}-website-production-assets`, {
      accessControl: BucketAccessControl.PUBLIC_READ,
      bucketName: `hackerinthewoods-website-prod-static-assets`,
      publicReadAccess: true,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404/index.html",
    });

    this.productionDistribution = new CloudFrontWebDistribution(
      this,
      `${id}-website-production-distribution`,
      {
        originConfigs: [
          {
            customOriginSource: {
              originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
              domainName: websiteAssets.bucketWebsiteDomainName,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
                compress: true,
              },
            ],
          },
        ],
        aliasConfiguration: {
          acmCertRef: certificateArn,
          names: [hostName],
        },
        priceClass: PriceClass.PRICE_CLASS_100,
      }
    );

    new BucketDeployment(this, "DeployWebsite", {
      actionName: "Website Deployment",
      sources: [Source.asset(join(__dirname, "..", "..", "build"))],
      destinationBucket: websiteAssets,
      distribution: this.productionDistribution,
      distributionPaths: ["/*"],
      cacheControl: [
        CacheControl.setPublic(),
        CacheControl.maxAge(Duration.days(1)),
      ],
      prune: false,
    });

    new ARecord(this, `${id}-alias-record-production`, {
      zone,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(this.productionDistribution)
      ),
      recordName: hostName,
    });

    // Redirection from www.hackerinthewoods.com to hackerinthewoods.com
    const websiteAssetsRedirect = new Bucket(
      this,
      `${id}-website-production-assets-www-redirect`,
      {
        bucketName: `www.${hostName}`,
        websiteRedirect: {
          hostName: hostName,
          protocol: RedirectProtocol.HTTPS,
        },
      }
    );

    const redirectDistribution = new CloudFrontWebDistribution(
      this,
      `${id}-website-production-distribution-redirect`,
      {
        defaultRootObject: "",
        originConfigs: [
          {
            customOriginSource: {
              originProtocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
              domainName: websiteAssetsRedirect.bucketWebsiteDomainName,
            },
            behaviors: [
              {
                isDefaultBehavior: true,
              },
            ],
          },
        ],
        aliasConfiguration: {
          acmCertRef: certificateArn,
          names: [`www.${hostName}`],
        },
        priceClass: PriceClass.PRICE_CLASS_100,
      }
    );

    new ARecord(this, `${id}-alias-record-production-www-redirect`, {
      zone,
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(redirectDistribution)
      ),
      recordName: `www.${hostName}`,
    });
  }
}

module.exports = { WebsiteStack };
