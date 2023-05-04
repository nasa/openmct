#!/bin/bash -e

# Check if required environment variables have values, exit if not.
check_env_var() {
    if [ -z "$1" ]; then
        echo "$2 has no value" 1>&2
        exit 1
    fi
}

check_env_var "${OPENMCT_DATABASE_NAME}" "OPENMCT_DATABASE_NAME"
check_env_var "${COUCH_ADMIN_USER}" "COUCH_ADMIN_USER"
check_env_var "${COUCH_BASE_LOCAL}" "COUCH_BASE_LOCAL"

# Construct curl's -u option value based on COUCH_ADMIN_USER and COUCH_ADMIN_PASSWORD environment variables.
CURL_USERPASS_ARG="${COUCH_ADMIN_USER}"
if [ "${COUCH_ADMIN_PASSWORD}" ]; then
    CURL_USERPASS_ARG+=":${COUCH_ADMIN_PASSWORD}"
fi

# Functions
resource_exists() {
    response=$(curl -u "${CURL_USERPASS_ARG}" -s -o /dev/null -I -w "%{http_code}" $1);
    if [ "200" == "${response}" ]; then
        echo "TRUE"
    else
        echo "FALSE";
    fi
}

db_exists() {
    resource_exists $COUCH_BASE_LOCAL/$OPENMCT_DATABASE_NAME
}

create_db() {
    response=$(curl -su "${CURL_USERPASS_ARG}" -XPUT $COUCH_BASE_LOCAL/$OPENMCT_DATABASE_NAME);
    echo $response
}

admin_user_exists() {
    response=$(curl -su "${CURL_USERPASS_ARG}" -o /dev/null -I -w "%{http_code}" $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/admins/$COUCH_ADMIN_USER);
    if [ "200" == "${response}" ]; then
        echo "TRUE"
    else
        echo "FALSE";
    fi
}

create_admin_user() {
    echo Creating admin user
    curl -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/admins/$COUCH_ADMIN_USER -d \'"$COUCH_ADMIN_PASSWORD"\'
}

is_cors_enabled() {
    resource_exists $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/httpd/enable_cors
}

enable_cors() {
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/httpd/enable_cors -d '"true"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/cors/origins -d '"*"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/cors/credentials -d '"true"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'
}

update_db_permissions() {
    local db_name=$1
    echo "Updating ${db_name} database permissions"
    response=$(curl -su "${CURL_USERPASS_ARG}" --location \
        --request PUT $COUCH_BASE_LOCAL/$db_name/_security \
        --header 'Content-Type: application/json' \
        --data-raw '{ "admins": {"roles": []},"members": {"roles": []}}')
    if [ "{\"ok\":true}" == "${response}" ]; then
        echo "Database permissions successfully updated"
    else
        echo "Database permissions not updated"
    fi
}

create_system_tables() {
    local system_tables=("_users" "_replicator")
    for table in "${system_tables[@]}"; do
        echo "Creating $table database"
        response=$(curl -su "${CURL_USERPASS_ARG}" -X PUT $COUCH_BASE_LOCAL/$table)
        if [ "{\"ok\":true}" == "${response}" ]; then
            echo "Successfully created $table database"
        else
            echo "Unable to create $table database"
        fi
    done
}

# Main script execution

# Check if the admin user exists; if not, create it.
if [ "$(admin_user_exists)" == "FALSE" ]; then
    echo "Admin user does not exist, creating..."
    create_admin_user
else
    echo "Admin user exists"
fi

# Check if system tables exist; if not, create them.
system_tables_exist=$(resource_exists $COUCH_BASE_LOCAL/_users)
if [ "TRUE" == "${system_tables_exist}" ]; then
    echo "System tables exist, skipping creation"
else
    echo "Fresh install, creating system tables"
    create_system_tables
fi

# Check if the database exists; if not, create it.
if [ "FALSE" == $(db_exists) ]; then
    response=$(create_db)
    if [ "{\"ok\":true}" == "${response}" ]; then
        echo "Database successfully created"
    else
        echo "Database creation failed"
    fi
else
    echo "Database already exists, nothing to do"
fi

# Update _replicator and OPENMCT_DATABASE_NAME database permissions
update_db_permissions "_replicator"
update_db_permissions "${OPENMCT_DATABASE_NAME}"

# Check if CORS is enabled; if not, enable it.
if [ "FALSE" == $(is_cors_enabled) ]; then
    echo "Enabling CORS"
    enable_cors
else
    echo "CORS enabled, nothing to do"
fi
