# test a test suite against a specific string
# useful for regression error testing or smoketesting

#!/usr/bin/env sh

trap "exit 0" TERM
set -e
set -o pipefail


TOP_PID=$$
found=false
correct=true
n_times=0

# Modify these yourself
max_runs=2
query="The quick brown fox jumps over the lazy dog"

function init() {
    clear
    ((n_times++))
    echo "Running regression: $n_times"
    exec npm run test | rl
}

function trap_n_exit() {
    echo "Exiting..."
    kill 0 $TOP_PID
}

function rl() {
    saved_line=""
    while IFS= read -r line
    do
    echo "$line"
    if [[ "$line" == *"$query"* ]]; then
        found=true
        echo "Found regression!"
        saved_line=$line
        break
    fi
    done
    if [[ "$found" == "$correct" ]]; then
        echo "\n Exiting application, regression found: \n"
        echo $saved_line
        echo "\n"
        trap_n_exit
    else
        run
    fi
}

function run() {
    if [[ "$n_times" -ge "$max_runs" ]]; then
        echo "Done after $n_times runs"
        trap_n_exit
    fi
    if [[ "$found" == "$correct" ]]; then
        clear
        trap_n_exit
    fi
    init
}

init