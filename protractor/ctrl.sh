#! /bin/bash
ARGUMENT=$1;
DIRECTORY=/Users/jsanderf/Applications;

if [ $# != 1 ]; then
    echo "Expected 1 Aurgument. Received " $# 1>&2;
    exit 1
fi
#Start webdrive and http-server
if [ $ARGUMENT == start ]; then
    echo
    echo "Starting MMAP ..."
    $DIRECTORY/MAMP/ctlscript.sh start  > logs/MAMP.log 2>&1 &
    wait $!    
    if [ $? != 0 ]; then
        echo "    Error: MMAP"
        echo "    Check Log file"
        echo
    else
        echo "    Started: MMAP"  
        echo
    fi
    echo "Starting webdriver ..."
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
    echo "Stopping MAMP"
    $DIRECTORY/MAMP/ctlscript.sh stop  >> logs/MAMP.log 2>&1 &
    sleep 1;
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
