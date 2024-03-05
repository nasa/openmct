.DEFAULT_GOAL := help

#------------------------------------------------------------------------------
# Purpose:
#   Makefile that allows one to docker build, install openmct and start openmct
#
# Dependencies:
#   make, docker, docker-compose
#------------------------------------------------------------------------------

.PHONY:

export SHELL :=/bin/bash
export UNAME :=$(shell uname)
export OS     =Linux

ifeq ($(UNAME), Darwin)
export OS=Darwin
endif

export DIFF_PROGRAM     :=vimdiff

export CONTAINER_BIN     =docker
export CONTAINER_COMPOSE =docker-compose
export CONTAINER_TAG     =openmct:latest

openmct-build: ## Build openmct on a docker image. This uses ./Dockerfile
	$(CONTAINER_BIN) build -t $(CONTAINER_TAG) .

openmct-start: openmct-build ## Start openmct in docker container, in a detached state. This uses ./docker-compose.yml
	$(CONTAINER_COMPOSE) up -d --remove-orphans
	@echo
	@echo "Connect via http://localhost:8080"
	@echo

openmct-stop: ## Stop openmct on docker conainter
	$(CONTAINER_COMPOSE) down -v --remove-orphans

openmct-shell: openmct-start ## Shell into running container
	$(CONTAINER_COMPOSE) exec -it openmct bash

print-%: ## print a variable and its value, e.g. print the value of variable PROVIDER: make print-PROVIDER
	@echo $* = $($*)

define print-help
$(call print-target-header,"Makefile Help")
	echo
	printf "%s\n" "Illustrates how to use IaC tools by example. It will be different in operations"
	echo
$(call print-target-header,"target                         description")
	grep -E '^([a-zA-Z_-]).+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS=":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' | grep $(or $1,".*")
	echo
endef

help:
	@$(call print-help)

help-%: ## Filtered help, e.g.: make help-terraform
	@$(call print-help,$*)

print-%:
	@echo $*=$($*)
