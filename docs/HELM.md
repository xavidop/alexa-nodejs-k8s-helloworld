# Helm

## Add Helm repos
helm repo add bitnami https://charts.bitnami.com/bitnami
Mongo chart: https://github.com/bitnami/charts/tree/master/bitnami/mongodb

## Install
helm install alexa-skill helm/alexa-skill-chart/ --namespace alexa-skill

## Uninstall
helm uninstall alexa-skill --namespace alexa-skill