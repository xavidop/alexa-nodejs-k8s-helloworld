# Alexa and Kubernetes: Deploying the Alexa Skill on AWS Elastic Kubernetes Services

Now we have everything prepared and ready to go to a Kubernetes Cluster in a cloud provider. It is a fact that create a cluster in any cloud provider manually ias a hard task. Moreover if we want to automate this deployments we need something that help us in this tedious task. In this Markdown we will see how to create a Kubernetes Cluster and all of its required objects and deploying our Alexa Skill with Terraform using [Elastic Kubernetes Service](https://aws.amazon.com/eks/)

![image](../img/eks/eks.jpg)

## Prerequisites

Here you have the technologies used in this project
1. Node.js v12.x
2. Visual Studio Code
3. Docker 19.x
4. Kubectl CLI
5. MongoDB Atlas Account
6. Kind
7. go >=1.11
8. Terraform 12.x
9. AWS Account
10. AWS CLI
10. AWS IAM Authenticator CLI

## Terraform

Terraform is a tool for building, changing, and versioning infrastructure safely and efficiently. Terraform can manage existing and popular service providers as well as custom in-house solutions.

Configuration files describe to Terraform the components needed to run a single application or your entire datacenter. Terraform generates an execution plan describing what it will do to reach the desired state, and then executes it to build the described infrastructure. As the configuration changes, Terraform is able to determine what changed and create incremental execution plans which can be applied.

The infrastructure Terraform can manage includes low-level components such as compute instances, storage, and networking, as well as high-level components such as DNS entries, SaaS features, etc.
## Terraform files

After the brief overview of Terraform, we are going to explaining all the terraform files and its objects tat we are going to use to deploy de cluster and our Alexa Skill. 
You can find all the files related to this deployment in `terraform/eks` folder.

### Terraform Providers

A provider is responsible for understanding API interactions and exposing resources.
Most of the available providers correspond to one cloud or on-premises infrastructure platform and offers resource types that correspond to each of the features of that platform.

For the Elastic Kubernetes Service, we will use the `aws` provider. This provider allow us to create all AWS objects that we need to create our Alexa Skill Stack:
```hcl
provider "aws" {
  region = "eu-central-1"
}
```

As we are going to deploy Helm Charts, it will be required to have the `helm` provider:
```hcl
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}
```

As we are going to with the cluster, it will be useful to have the `kubernetes` provider:
```hcl
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority.0.data)
  token                  = data.aws_eks_cluster_auth.cluster.token
  load_config_file       = false
}
```

### Terraform Modules and Resources

One of the most important resources of an EKS Cluster is the networks. Because fo that, we have to create our Virtual Private Cloud Network and Subnetworks. For that, we need to use the `vpc` module::
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "2.64.0"

  name                 = "k8s-vpc"
  cidr                 = "172.16.0.0/16"
  azs                  = data.aws_availability_zones.available.names
  private_subnets      = ["172.16.1.0/24", "172.16.2.0/24", "172.16.3.0/24"]
  public_subnets       = ["172.16.4.0/24", "172.16.5.0/24", "172.16.6.0/24"]
  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
}
```

Once the Private cloud Network has been created, we can create te cluster that will use that VPC. For that, we need to use the `eks` module:
```hcl
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "13.2.1"

  cluster_name    = local.cluster_name
  cluster_version = "1.18"
  subnets         = module.vpc.private_subnets
  wait_for_cluster_cmd          = "until curl -k -s $ENDPOINT/healthz >/dev/null; do sleep 4; done"
  wait_for_cluster_interpreter = ["C:/Program Files/Git/bin/sh.exe", "-c"]

  vpc_id = module.vpc.vpc_id

  node_groups = {
    first = {
      desired_capacity = 2
      max_capacity     = 10
      min_capacity     = 2

      instance_type = "m5.large"
    }
  }

  write_kubeconfig   = true
  config_output_path = "./"

  workers_additional_policies = [aws_iam_policy.worker_policy.arn]
}
```

Moreover, we will create some specific AWS IAM Policies to our Kubernetes Cluster Nodes in order to be reachable from the internet. For that we will use the `aws_iam_policy` resource:
```hcl
resource "aws_iam_policy" "worker_policy" {
  name        = "worker-policy"
  description = "Worker policy for the ALB Ingress"

  policy = file("iam-policy.json")
}
```

All the resources and modules commented above are related to the Kubernetes cluster. Now it's time to deploy our Alexa Skill starting with the `ngingx-ingress-controller`:
```hcl

resource "helm_release" "ingress" {
  name       = "nginx-ingress-controller"
  chart      = "nginx-ingress-controller"
  repository = "https://charts.bitnami.com/bitnami"

  set {
    name  = "rbac.create"
    value = "true"
  }
}
```

After that, we can proudly deploy our alexa Skill Helm chart in our Kubernetes Cloud cluster:
```hcl
resource "helm_release" "alexa-skill" {
  name       = "alexa-skill"
  chart      = "../../helm/alexa-skill-chart"
  depends_on = [helm_release.ingress]
}
```


### Terraform Variables

We have provided some variables that you can modify easily in order to change the name of the cluster or the region where the cluster will be deployed. For that you can modify the local variables on `main.tf`:
```hcl
locals {
  cluster_name = "alexa-cluster"
  region       = "eu-central-1"
}
```

## Deploying the Stack

In order to make a provider available on Terraform, we need to make a `terraform init`, these commands download any plugins we need for our providers.
After that, we have to execute `terraform plan`. The terraform plan command is used to create an execution plan.
It will not modify things in infrastructure.
Terraform performs a refresh, unless explicitly disabled, and then determines what actions are necessary to achieve the desired state specified in the configuration files.
This command is a convenient way to check whether the execution plan for a set of changes matches your expectations without making any changes to real resources or to the state.
Then, we need to execute `terraform apply`. The terraform apply command is used to apply the changes required to reach the desired state of the configuration.
Terraform apply will also write data to the terraform.tfstate file.
Once the application is completed, resources are immediately available.

Here you have the full command list:
```bash
terraform init
terraform plan
terraform appyly
```

After running the `terraform apply`, we can take a look to Elastic Kubernetes Service to see that our cluster now appears:
![image](../img/eks/cluster-creating.png)

We need to wait like 10 minutes until the cluster is created. Once the cluster is created now we can see the full specifications:
![image](../img/eks/cluster-created.png)

After the cluster creation, Terraform will deploy all the Helm charts. Here you can see all the Kubernetes Pods deployed:
![image](../img/eks/eks-pods.png)

And here the Kubernetes Services and the external IP of the `nginx-ingress-controller`. That IP is the one we are going to use to make Alexa requests:
![image](../img/eks/eks-service-ingress.png)


## Testing requests

I'm sure you already know the famous tool call [Postman](https://www.postman.com/). REST APIs have become the new standard in providing a public and secure interface for your service. Though REST has become ubiquitous, it's not always easy to test. Postman, makes it easier to test and manage HTTP REST APIs. Postman gives us multiple features to import, test and share APIs, which will help you and your team be more productive in the long run.

After run your application you will have an endpoint available at http://a6ae89bc3ff9745de8bd095000264ff6-1697202105.eu-central-1.elb.amazonaws.com. With Postman you can emulate any Alexa Request. 

For example, you can test a `LaunchRequest`:

```json

  {
    "version": "1.0",
    "session": {
      "new": true,
      "sessionId": "amzn1.echo-api.session.[unique-value-here]",
      "application": {
        "applicationId": "amzn1.ask.skill.[unique-value-here]"
      },
      "user": {
        "userId": "amzn1.ask.account.[unique-value-here]"
      },
      "attributes": {}
    },
    "context": {
      "AudioPlayer": {
        "playerActivity": "IDLE"
      },
      "System": {
        "application": {
          "applicationId": "amzn1.ask.skill.[unique-value-here]"
        },
        "user": {
          "userId": "amzn1.ask.account.[unique-value-here]"
        },
        "device": {
          "supportedInterfaces": {
            "AudioPlayer": {}
          }
        }
      }
    },
    "request": {
      "type": "LaunchRequest",
      "requestId": "amzn1.echo-api.request.[unique-value-here]",
      "timestamp": "2020-03-22T17:24:44Z",
      "locale": "en-US"
    }
  }
```

![image](../img/eks/eks-request.png)
## Destroy the Stack

If we want to remove all the stack created by Terraform, just run:
```bash
terraform destroy
```
## Resources
* [Official Alexa Skills Kit Node.js SDK](https://www.npmjs.com/package/ask-sdk) - The Official Node.js SDK Documentation
* [Official Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html) - Official Alexa Skills Kit Documentation
* [Official Express Adapter Documentation](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html) - Express Adapter Documentation
* [Official Kind Documentation](https://kind.sigs.k8s.io/) - Kind Documentation
* [Official Kubernetes Documentation](https://kubernetes.io/docs) - Kubernetes Documentation
* [Terraform EKS](https://learnk8s.io/terraform-eks) - Terraform EKS
* [Terraform EKS Github](https://github.com/k-mitevski/terraform-k8s/tree/master/04_terraform_helm_provider) - Terraform EKS GitHub
## Conclusion 

Now we have our Alexa Skill running in a Kubernetes Cluster of our cloud provider everything automated with Terraform and ready to use in our live Alexa Skills.

I hope this example project is useful to you.

That's all folks!

Happy coding!
