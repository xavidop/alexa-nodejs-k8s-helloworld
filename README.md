# Docker

docker build -t xavidop/alexa-skill-nodejs-express:latest -f docker/Dockerfile .

docker push xavidop/alexa-skill-nodejs-express:latest

docker run -i -p 3000:3000 -t xavidop/alexa-skill-nodejs-express:latest

https://hub.docker.com/repository/docker/xavidop/alexa-skill-nodejs-express/general


# Kubernetes

kind create cluster --config cluster.yaml

kubectl cluster-info --context kind-kind

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/static/provider/kind/deploy.yaml

# Helm
❯ helm install alexa-skill helm/alexa-skill-chart/ --namespace alexa-skill

helm uninstall alexa-skill --namespace alexa-skill