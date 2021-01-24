# Alexa and Kubernetes: Deploying the Alexa Skill on Google Kubernetes Engine

Now we have everything prepared and ready to go to a Kubernetes Cluster in a cloud provider. It is a fact that create a cluster in any cloud provider manually ias a hard task. Moreover if we want to automate this deplyoments we need something that help us in this tedious task. In this Markdown we will see how to create a Kubernetes Cluster and all of its required objects and deploying our Alexa Skill with Terraform using [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine?)

![image](../img/gke/gke.png)

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
9. Google Cloud Account
10. gcloud CLI

## Terraform

Terraform is a tool for building, changing, and versioning infrastructure safely and efficiently. Terraform can manage existing and popular service providers as well as custom in-house solutions.

Configuration files describe to Terraform the components needed to run a single application or your entire datacenter. Terraform generates an execution plan describing what it will do to reach the desired state, and then executes it to build the described infrastructure. As the configuration changes, Terraform is able to determine what changed and create incremental execution plans which can be applied.

The infrastructure Terraform can manage includes low-level components such as compute instances, storage, and networking, as well as high-level components such as DNS entries, SaaS features, etc.
## Terraform files
After the brief overview of Terraform, we are going to explaing all the terraform files and its objects tat we are going to use to deploy de cluster and our Alexa Skill. 
You can find all the files related to this deployment in `terraform/gke` folder.

### Terraform Providers

A provider is responsible for understanding API interactions and exposing resources.
Most of the available providers correspond to one cloud or on-premises infrastructure platform and offers resource types that correspond to each of the features of that platform.

For the Google kubernetes Engine, we will use the `google` provider. This provider allow us to create all Google Cloud objects that we need to create our Alexa Skill Stack:
```hcl
provider "google" {
  project = var.project_id
  region  = var.region
}

```

As we are going to deploy Helm Charts, it will be required to have the `helm` provider:
```hcl
provider "helm" {

  kubernetes {
    host                   = google_container_cluster.primary.endpoint
    token                  = data.google_client_config.current.access_token
    client_certificate     = base64decode(google_container_cluster.primary.master_auth.0.client_certificate)
    client_key             = base64decode(google_container_cluster.primary.master_auth.0.client_key)
    cluster_ca_certificate = base64decode(google_container_cluster.primary.master_auth.0.cluster_ca_certificate)
  }
}

```



### Terraform Resources

One of the most important resourcers of an EKS Cluster is the networking. Because fo that, we have to create our Virtual Private Cloud Network and Subnetworks:

```hcl
resource "google_compute_network" "vpc" {
  name                    = "${var.project_id}-vpc"
  auto_create_subnetworks = "false"
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "${var.project_id}-subnet"
  region        = var.region
  network       = google_compute_network.vpc.name
  ip_cidr_range = "10.10.0.0/24"

}
```

Once the Private cloud Network has been created, we can create te cluster that will use that VPC. For that, we need to use the `google_container_cluster` module:
```hcl
resource "google_container_cluster" "primary" {
  name     = "${var.project_id}-gke"
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = google_compute_network.vpc.name
  subnetwork = google_compute_subnetwork.subnet.name

}
```

Every cluster should have a pool of Nodes where the kubernetes objects will be deployed. For creating that pool of nodes on Google Cloud we will use the `google_container_node_pool` resource:
```hcl
resource "google_container_node_pool" "primary_nodes" {
  name       = "${google_container_cluster.primary.name}-node-pool"
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.gke_num_nodes

  node_config {
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]

    labels = {
      env = var.project_id
    }

    # preemptible  = true
    machine_type = "n1-standard-1"
    tags         = ["gke-node", "${var.project_id}-gke"]
    metadata = {
      disable-legacy-endpoints = "true"
    }
  }
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

Aftear that, we can proudly deploy our alexa Skill Helm chart in our Kubernetes Cloud cluster:
```hcl
resource "helm_release" "alexa-skill" {
  name       = "alexa-skill"
  chart      = "../../helm/alexa-skill-chart"
  depends_on = [helm_release.ingress]
}
```


### Terraform Variables

We have provided some variables that you can modify easily in order to change the name of the project_id or the region where the cluster will be deployed. For that you can modify the variables on `terraform.tfvars`:
```properties
project_id = "alexa-k8s"
region     = "us-central1"
```

To create a Google Cloud project using the `gcloud` cli and setting this project as the default project, we need to execute the following commands:
```bash
gcloud init
gcloud projects create alexa-k8s
gcloud auth application-default login
gcloud config set project alexa-k8s
gcloud config get-value project
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
After running the `terraform apply`, we can take a look to Google kubernetes Engine to see that our cluster now appears:
![image](../img/gke/cluster-creating.png)

We need to wait like 10 minutes until the cluster is created. Once the cluster is created now we can see the full specifications:
![image](../img/gke/cluster-created.png)

After the cluster creation, Terraform will deploy all the Helm charts. Here you can see all the Kubernetes Pods deployed:
![image](../img/gke/gks-pods.png)

And here the Kubernetes Services and the external IP of the `nginx-ingress-controller`. That IP is the one we are going to use to make Alexa requests:
![image](../img/gke/gks-service-ingress.png)


## Testing requests

I'm sure you already know the famous tool call [Postman](https://www.postman.com/). REST APIs have become the new standard in providing a public and secure interface for your service. Though REST has become ubiquitous, it's not always easy to test. Postman, makes it easier to test and manage HTTP REST APIs. Postman gives us multiple features to import, test and share APIs, which will help you and your team be more productive in the long run.

After run your application you will have an endpoint available at http://35.193.101.213. With Postman you can emulate any Alexa Request. 

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

![image](../img/gke/gks-request.png)
## Destroy the Stack

```bash
terraform destroy
```
## Resources
* [Official Alexa Skills Kit Node.js SDK](https://www.npmjs.com/package/ask-sdk) - The Official Node.js SDK Documentation
* [Official Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html) - Official Alexa Skills Kit Documentation
* [Official Express Adapter Documentation](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-nodejs/host-web-service.html) - Express Adapter Documentation
* [Official Kind Documentation](https://kind.sigs.k8s.io/) - Kind Documentation
* [Official Kubernetes Documentation](https://kubernetes.io/docs) - Kubernetes Documentation
* [Terraform GKE](https://learn.hashicorp.com/tutorials/terraform/gke) - Terraform GKE
* [Terraform GKE Official](https://github.com/hashicorp/learn-terraform-provision-gke-cluster) - Terraform Official
* [Terraform GKE Github](https://github.com/GoogleCloudPlatform/terraform-google-examples/tree/master/example-gke-k8s-helm) - Terraform GKE GitHub
## Conclusion 

Now we have our Alexa Skill running in a Kubernetes Cluster of our cloud provider everything automated with Terraform and ready to use in our live Alexa Skills.

I hope this example project is useful to you.

That's all folks!

Happy coding!