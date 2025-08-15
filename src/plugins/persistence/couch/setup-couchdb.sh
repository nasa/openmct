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

resource_exists() {
    response=$(curl -u "${CURL_USERPASS_ARG}" -s -o /dev/null -I -w "%{http_code}" $1);
    if [ "200" == "${response}" ]; then
        echo "TRUE"
    else
        echo "FALSE";
    fi
}

db_exists() {
    resource_exists "$COUCH_BASE_LOCAL"/"$OPENMCT_DATABASE_NAME"
}

create_db() {
    response=$(curl -su "${CURL_USERPASS_ARG}" -XPUT "$COUCH_BASE_LOCAL"/"$OPENMCT_DATABASE_NAME");
    echo "$response"
}

admin_user_exists() {
    response=$(curl -su "${CURL_USERPASS_ARG}" -o /dev/null -I -w "%{http_code}" "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/admins/"$COUCH_ADMIN_USER");
    if [ "200" == "${response}" ]; then
        echo "TRUE"
    else
        echo "FALSE";
    fi
}

create_admin_user() {
    echo Creating admin user
    curl -X PUT "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/admins/"$COUCH_ADMIN_USER" -d \'"$COUCH_ADMIN_PASSWORD"\'
}

is_cors_enabled() {
    resource_exists "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/httpd/enable_cors
}

enable_cors() {
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/httpd/enable_cors -d '"true"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/cors/origins -d '"*"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/cors/credentials -d '"true"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
    curl -su "${CURL_USERPASS_ARG}" -o /dev/null -X PUT "$COUCH_BASE_LOCAL"/_node/"$COUCH_NODE_NAME"/_config/cors/headers -d '"accept, authorization, content-type, origin, referer, x-csrf-token"'
}

update_db_permissions() {
    local db_name=$1
    echo "Updating ${db_name} database permissions"
    response=$(curl -su "${CURL_USERPASS_ARG}" --location \
        --request PUT "$COUCH_BASE_LOCAL"/"$db_name"/_security \
        --header 'Content-Type: application/json' \
        --data-raw '{ "admins": {"roles": []},"members": {"roles": []}}')
    if [ "{\"ok\":true}" == "${response}" ]; then
        echo "Database permissions successfully updated"
    else
        echo "Database permissions not updated"
    fi
}

create_users_table() {
    echo "Creating _users database"
    response=$(curl -su "${CURL_USERPASS_ARG}" -XPUT "$COUCH_BASE_LOCAL"/_users)
    if [ "{\"ok\":true}" == "${response}" ]; then
        echo "Successfully created _users database"
    else
        echo "Unable to create _users database"
    fi
}

create_replicator_table() {
    echo "Creating _replicator database"
    response=$(curl -su "${CURL_USERPASS_ARG}" -XPUT "$COUCH_BASE_LOCAL"/_replicator)
    if [ "{\"ok\":true}" == "${response}" ]; then
        echo "Successfully created _replicator database"
    else
        echo "Unable to create _replicator database"
    fi
}

add_index_and_views() {
    echo "Adding index and views to $OPENMCT_DATABASE_NAME database"

    # Add type_tags_index
    response=$(curl --silent --user "${CURL_USERPASS_ARG}" --request POST "$COUCH_BASE_LOCAL"/"$OPENMCT_DATABASE_NAME"/_index/\
    --header 'Content-Type: application/json' \
    --data '{
        "index": {
            "fields": ["model.type", "model.tags"]
        },
        "name": "type_tags_index",
        "type": "json"
    }')

    if [[ $response =~ "\"result\":\"created\"" ]]; then
        echo "Successfully created type_tags_index"
    elif [[ $response =~ "\"result\":\"exists\"" ]]; then
        echo "type_tags_index already exists, skipping creation"
    else
        echo "Unable to create type_tags_index"
        echo $response
    fi

    # Add annotation_tags_index
    response=$(curl  --silent --user "${CURL_USERPASS_ARG}" --request PUT "$COUCH_BASE_LOCAL"/"$OPENMCT_DATABASE_NAME"/_design/annotation_tags_index \
    --header 'Content-Type: application/json' \
    --data '{
        "_id": "_design/annotation_tags_index",
        "views": {
            "by_tags": {
                "map": "function (doc) { if (doc.model && doc.model.type === '\''annotation'\'' && doc.model.tags) { doc.model.tags.forEach(function (tag) { emit(tag, doc._id); }); } }"
            }
        }
    }')

    if [[ $response =~ "\"ok\":true" ]]; then
        echo "Successfully created annotation_tags_index"
    elif [[ $response =~ "\"error\":\"conflict\"" ]]; then
        echo "annotation_tags_index already exists, skipping creation"
    else
        echo "Unable to create annotation_tags_index"
        echo $response
    fi

    # Add annotation_keystring_index
    response=$(curl --silent --user "${CURL_USERPASS_ARG}" --request PUT "$COUCH_BASE_LOCAL"/"$OPENMCT_DATABASE_NAME"/_design/annotation_keystring_index \
    --header 'Content-Type: application/json' \
    --data '{
        "_id": "_design/annotation_keystring_index",
        "views": {
            "by_keystring": {
                "map": "function (doc) { if (doc.model && doc.model.type === '\''annotation'\'' && doc.model.targets) { doc.model.targets.forEach(function(target) { if(target.keyString) { emit(target.keyString, doc._id); } }); } }"
            }
        }
    }')

    if [[ $response =~ "\"ok\":true" ]]; then
        echo "Successfully created annotation_keystring_index"
    elif [[ $response =~ "\"error\":\"conflict\"" ]]; then
        echo "annotation_keystring_index already exists, skipping creation"
    else
        echo "Unable to create annotation_keystring_index"
        echo $response
    fi
}

# Main script execution

# Check if the admin user exists; if not, create it.
if [ "$(admin_user_exists)" == "FALSE" ]; then
    echo "Admin user does not exist, creating..."
    create_admin_user
else
    echo "Admin user exists"
fi

# Check if the _users table exists; if not, create it.
users_table_exists=$(resource_exists "$COUCH_BASE_LOCAL"/_users)
if [ "FALSE" == "${users_table_exists}" ]; then
    create_users_table
else
    echo "_users database already exists, skipping creation"
fi

# Check if the _replicator database exists; if not, create it.
replicator_table_exists=$(resource_exists "$COUCH_BASE_LOCAL/_replicator")
if [ "FALSE" == "${replicator_table_exists}" ]; then
    create_replicator_table
else
    echo "_replicator database already exists, skipping creation"
fi

# Check if the database exists; if not, create it.
if [ "FALSE" == "$(db_exists)" ]; then
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
if [ "FALSE" == "$(is_cors_enabled)" ]; then
    echo "Enabling CORS"
    enable_cors
else
    echo "CORS enabled, nothing to do"
fi

# Add index and views to the database
add_index_and_views
