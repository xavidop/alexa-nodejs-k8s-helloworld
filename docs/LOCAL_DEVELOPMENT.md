# Kubernetes

## Kind configuration
kind create cluster --config cluster.yaml

kubectl cluster-info --context kind-kind
kubectl create namespace alexa-skill

## Install NGINX
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/kind/deploy.yaml

## Devespace
devspace use namespace alexa-skill
devspace dev
devspace purge -d alexa-skill