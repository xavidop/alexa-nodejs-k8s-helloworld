# Docker

## Build
docker build -t xavidop/alexa-skill-nodejs-express:latest -f docker/Dockerfile .

docker push xavidop/alexa-skill-nodejs-express:latest

## Run
docker run -i -p 3000:3000 -t xavidop/alexa-skill-nodejs-express:latest

https://hub.docker.com/repository/docker/xavidop/alexa-skill-nodejs-express/general


# Kubernetes

## Kind configuration
kind create cluster --config cluster.yaml

kubectl cluster-info --context kind-kind
kubectl create namespace alexa-skill

## Install NGINX
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/kind/deploy.yaml

# Helm

## Add Helm repos
helm repo add bitnami https://charts.bitnami.com/bitnami
Mongo chart: https://github.com/bitnami/charts/tree/master/bitnami/mongodb

## Install
helm install alexa-skill helm/alexa-skill-chart/ --namespace alexa-skill

## Uninstall
helm uninstall alexa-skill --namespace alexa-skill

# Troubleshooting

## Connect to pod

kubectl exec --stdin --tty alexa-skill-fc6cdd855-ldfvg -n alexa-skill -- /bin/sh

## Mongo Connection

mongo mongodb://root:root@alexa-skill-mongodb:27017/alexa

# Mongo Atlas Schema
![image](docs/atlas.png)

# Provided Mongo Schema
![image](docs/provided.png)
