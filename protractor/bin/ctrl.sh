#! /bin/bash
ARGUMENT=$1;

if [ $# != 1 ]; then
    echo "Expected 1 Aurgument. Received " $# 1>&2;
    exit 1
fi
#Start webdrive and http-server
if [ $ARGUMENT == start ]; then
    echo "Creating Log Directory ..."    
    mkdir logs;
    
    cd ..
    node app.js -p 1984 -x platform/persistence/elastic -i example/persistence > protractor/logs/nodeApp.log 2>&1 &
    sleep 3;
    if grep -iq "Error"  protractor/logs/nodeApp.log; then
        if grep -iq "minimist"  protractor/logs/nodeApp.log; then
            echo "  Node Failed Because Minimist is not installed"
            echo "  Installng Minimist ..."
            npm install minimist express > protractor/logs/minimist.log 2>&1 &
            wait $!    
            if [ $? != 0 ]; then
                echo "    Error: minimist"
                echo "    Check Log file"
                echo
            else
                echo "    Started: Minimist"  
                echo
                node app.js -p 1984 -x platform/persistence/elastic -i example/persistence > protractor/logs/nodeApp.log 2>&1 &
                if grep -iq "Error"  protractor/logs/nodeApp.log; then
                    echo "    Error: node app failed"
                    echo "    Check Log file"
                    echo
                else
                    echo "    Started: node app.js"  
                    echo
                fi
            fi
        else    
            echo "    Error: node app failed"
            echo "    Check Log file"
            echo
        fi
    else
        echo "    Started: node app.js"  
        echo
    fi
    echo "Starting webdriver ..."
    
    cd protractor;
    webdriver-manager start > logs/webdriver.log 2>&1 &
    sleep 3;
    if grep -iq "Exception"  logs/webdriver.log; then
        echo "    Error: webdriver-manager"
        echo "    Check Log file"
        echo 
    else
        echo "    Started: webdriver-manager"  
    fi
    echo "Starting Elastic Search..."
    
    elasticsearch > logs/elasticSearch.log 2>&1 &
    sleep 3;
    if grep -iq "Exception"  logs/elasticSearch.log; then
        echo "    Error: ElasticSearch"
        echo "    Check Log file"
        echo 
    else
        echo "    Started: ElasticSearch"
    fi
#Runs Protractor tests    
elif [ $ARGUMENT == run ]; then
    protractor ./conf.js
#Kill Process    
elif [ $ARGUMENT == stop ]; then
    echo "Removing logs"
    rm -rf logs
    echo "Stopping Node"
    kill $(ps aux | grep "[n]ode app.js"| awk '{print $2}');
    
    echo "Stopping webdriver ..."
    kill $(ps aux | grep "[p]rotractor" | awk '{print $2}');
    kill $(ps aux | grep "[w]ebdriver-manager" | awk '{print $2}');
    sleep 1;
    echo "Stopping Elastic..."
    kill $(ps aux | grep "[e]lastic" | awk '{print $2}');
    sleep 1; 
else 
    echo "Unkown: Command" $1;
fi
