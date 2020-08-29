.DEFAULT_GOAL := help

#------------------------------------------------------------------------------
# Purpose:
#   Makefile that allows one to docker build, install openmct and start openmct
#
# Author: 
#  Haisam Ido<haisam.ido@gmail.com>
#
# Dependencies:
#   make, docker, docker-compose
#------------------------------------------------------------------------------

openmct-install: ## Install openmct on a docker image, which uses ./Dockerfile
	docker build -t openmct:latest .

openmct-up: openmct-install openmct-down ## Start openmct in docker container, in an attached state, which uses ./docker-compose.yml
	docker-compose up

openmct-down: ## Stop openmct on docker conainter
	docker-compose down -v

openmct-inspect: ## Shell into running container
	docker exec -it openmct_openmct_1 bash

help:
	@printf "\033[37m%-30s\033[0m %s\n" "#----------------------------------------------------------------------------------"
	@printf "\033[37m%-30s\033[0m %s\n" "# Makefile targets                          |"
	@printf "\033[37m%-30s\033[0m %s\n" "#----------------------------------------------------------------------------------"
	@printf "\033[37m%-30s\033[0m %s\n" "#-target-----------------------description-----------------------------------------"
	@grep -E '^[a-zA-Z_-].+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

print-%:
	@echo $* = $($*)