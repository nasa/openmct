#!/bin/bash

# Get the container ID of the Docker container with image starting with "mcr.microsoft.com/playwright"
container_id=$(docker ps --format '{{.ID}}\t{{.Image}}' | grep "mcr.microsoft.com/playwright" | cut -f1)

if [ -z "$container_id" ]; then
  echo "No container found with image starting with 'mcr.microsoft.com/playwright'"
  exit 1
fi

# Get the network associated with the found container
network_name=$(docker inspect $container_id -f '{{range .NetworkSettings.Networks}}{{.NetworkID}}{{end}}')

if [ -z "$network_name" ]; then
  echo "No network found associated with the container"
  exit 1
fi

# Connect the couch_couchdb1 network to the found network
docker network connect couch_couchdb1 $network_name
echo "Connected couch_couchdb1 to the network of the container with ID $container_id"
