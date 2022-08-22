#!/bin/bash -e

# Do a couple checks for environment variables we expect to have a value.

if [ -z "${OPENMCT_DATABASE_NAME}" ] ; then
    echo "OPENMCT_DATABASE_NAME has no value" 1>&2
    exit 1
fi

if [ -z "${COUCH_ADMIN_USER}" ] ; then
    echo "COUCH_ADMIN_USER has no value" 1>&2
    exit 1
fi

if [ -z "${COUCH_BASE_LOCAL}" ] ; then
    echo "COUCH_BASE_LOCAL has no value" 1>&2
    exit 1
fi

# Come up with what we'll be providing to curl's -u option. Always supply the username from the environment,
# and optionally supply the password from the environment, if it has a value.
CURL_USERPASS_ARG="${COUCH_ADMIN_USER}"
if [ "${COUCH_ADMIN_PASSWORD}" ] ; then
    CURL_USERPASS_ARG+=":${COUCH_ADMIN_PASSWORD}"
fi

system_tables_exist () {
    resource_exists $COUCH_BASE_LOCAL/_users
}

create_users_db () {
    curl -su "${CURL_USERPASS_ARG}" -X PUT $COUCH_BASE_LOCAL/_users
}

create_replicator_db () {
    curl -su "${CURL_USERPASS_ARG}" -X PUT $COUCH_BASE_LOCAL/_replicator
}

setup_system_tables () {
    users_db_response=$(create_users_db)
    if [ "{\"ok\":true}" == "${users_db_response}" ]; then
        echo Successfully created users db
        replicator_db_response=$(create_replicator_db)
        if [ "{\"ok\":true}" == "${replicator_db_response}" ]; then
            echo Successfully created replicator DB
        else
            echo Unable to create replicator DB
        fi
    else
        echo Unable to create users db
    fi
}

resource_exists () {
    response=$(curl -u "${CURL_USERPASS_ARG}" -s -o /dev/null -I -w "%{http_code}" $1);
    if [ "200" == "${response}" ]; then
        echo "TRUE"
    else
        echo "FALSE";
    fi
}

db_exists () {
    resource_exists $COUCH_BASE_LOCAL/$OPENMCT_DATABASE_NAME
}

create_db () {
    response=$(curl -su "${CURL_USERPASS_ARG}" -XPUT $COUCH_BASE_LOCAL/$OPENMCT_DATABASE_NAME);
    echo $response
}

admin_user_exists () {
    response=$(curl -su "${CURL_USERPASS_ARG}" -o /dev/null -I -w "%{http_code}" $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/admins/$COUCH_ADMIN_USER);
    if [ "200" == "${response}" ]; then
        echo "TRUE"
    else
        echo "FALSE";
    fi
}

create_admin_user () {
    echo Creating admin user
    curl -X PUT $COUCH_BASE_LOCAL/_node/$COUCH_NODE_NAME/_config/admins/$COUCH_ADMIN_USER -d \'"$COUCH_ADMIN_PASSWORD"\'
}

if [ "$(admin_user_exists)" == "FALSE" ]; then
    echo "Admin user does not exist, creating..."
    create_admin_user
else
    echo "Admin user exists"
fi

if [ "TRUE" == $(system_tables_exist) ]; then
    echo System tables exist, skipping creation
else
    echo Is fresh install, creating system tables
    setup_system_tables
fi

if [ "FALSE" == $(db_exists) ]; then
    response=$(create_db)
    if [ "{\"ok\":true}" == "${response}" ]; then
        echo Database successfully created
    else
        echo Database creation failed
    fi
else
    echo Database already exists, nothing to do
fi

echo "Updating _replicator database permissions"
response=$(curl -su "${CURL_USERPASS_ARG}" --location --request PUT $COUCH_BASE_LOCAL/_replicator/_security --header 'Content-Type: application/json' --data-raw '{ "admins": {"roles": []},"members": {"roles": []}}');
if [ "{\"ok\":true}" == "${response}" ]; then
    echo "Database permissions successfully updated"
else
    echo "Database permissions not updated"
fi

echo "Updating ${OPENMCT_DATABASE_NAME} database permissions"
response=$(curl -su "${CURL_USERPASS_ARG}" --location --request PUT $COUCH_BASE_LOCAL/$OPENMCT_DATABASE_NAME/_security --header 'Content-Type: application/json' --data-raw '{ "admins": {"roles": []},"members": {"roles": []}}');
if [ "{\"ok\":true}" == "${response}" ]; then
    echo "Database permissions successfully updated"
else
    echo "Database permissions not updated"
fi
