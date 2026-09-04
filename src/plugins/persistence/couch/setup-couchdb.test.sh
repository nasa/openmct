#!/bin/bash

# Tests for setup-couchdb.sh.
#
# These need nothing beyond bash: a stub `curl` is placed ahead of the real one
# on PATH and setup-couchdb.sh is run as a subprocess, so both
# admin_user_exists() and the code that acts on its answer are exercised.
#
# Run with: bash src/plugins/persistence/couch/setup-couchdb.test.sh

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_SCRIPT="${SCRIPT_DIR}/setup-couchdb.sh"

STUB_DIR="$(mktemp -d)"
STDOUT_FILE="${STUB_DIR}/stdout"
STDERR_FILE="${STUB_DIR}/stderr"
REQUEST_LOG_FILE="${STUB_DIR}/requests"
trap 'rm -rf "${STUB_DIR}"' EXIT

FAILURES=0
FAILURES_BEFORE_TEST=0
CURRENT_TEST=""
EXIT_CODE=0
STDOUT=""
STDERR=""

# A stand-in for curl. Every request is answered as though CouchDB is healthy,
# except the admin config lookup, whose transport result and HTTP status the
# tests drive through MOCK_ADMIN_CURL_RC and MOCK_ADMIN_HTTP_CODE.
cat > "${STUB_DIR}/curl" <<'STUB'
#!/bin/bash
echo "$*" >> "${MOCK_REQUEST_LOG:-/dev/null}"
is_admin_request=false
is_status_request=false
for argument in "$@"; do
    case "${argument}" in
        *"/_config/admins/"*) is_admin_request=true ;;
        "%{http_code}") is_status_request=true ;;
    esac
done

if [ "${is_admin_request}" = true ] && [ "${MOCK_ADMIN_CURL_RC:-0}" -ne 0 ]; then
    echo "curl: (${MOCK_ADMIN_CURL_RC}) stubbed transport failure" 1>&2
    exit "${MOCK_ADMIN_CURL_RC}"
fi

if [ "${is_status_request}" = true ]; then
    if [ "${is_admin_request}" = true ]; then
        echo "${MOCK_ADMIN_HTTP_CODE:-200}"
    else
        echo "200"
    fi
elif [[ "$*" == *"/_index"* ]]; then
    echo '{"result":"created"}'
else
    echo '{"ok":true}'
fi
STUB
chmod +x "${STUB_DIR}/curl"

# Usage: run_setup_script <admin-http-code> <admin-curl-rc> [direct]
# By default the script is started with `bash`, which skips the shebang and its
# -e flag — exactly how CI starts it. Pass "direct" to execute the script
# itself, so the `#!/bin/bash -e` line applies as it does for ./setup-couchdb.sh.
run_setup_script() {
    local launcher=(bash "${SETUP_SCRIPT}")
    if [ "${3:-bash}" = "direct" ]; then
        launcher=("${SETUP_SCRIPT}")
    fi
    : > "${REQUEST_LOG_FILE}"
    MOCK_ADMIN_HTTP_CODE="$1" \
    MOCK_ADMIN_CURL_RC="$2" \
    MOCK_REQUEST_LOG="${REQUEST_LOG_FILE}" \
    PATH="${STUB_DIR}:${PATH}" \
    OPENMCT_DATABASE_NAME="openmct" \
    COUCH_ADMIN_USER="admin" \
    COUCH_ADMIN_PASSWORD="password" \
    COUCH_BASE_LOCAL="http://localhost:5984" \
    COUCH_NODE_NAME="nonode@nohost" \
        "${launcher[@]}" > "${STDOUT_FILE}" 2> "${STDERR_FILE}"
    EXIT_CODE=$?
    STDOUT="$(cat "${STDOUT_FILE}")"
    STDERR="$(cat "${STDERR_FILE}")"
}

fail() {
    echo "    FAIL: $1"
    FAILURES=$((FAILURES + 1))
}

expect_exit_code() {
    if [ "${EXIT_CODE}" -ne "$1" ]; then
        fail "expected exit code $1, got ${EXIT_CODE}"
    fi
}

expect_failed_exit_code() {
    if [ "${EXIT_CODE}" -eq 0 ]; then
        fail "expected a non-zero exit code, got 0"
    fi
}

expect_stdout_contains() {
    if [[ "${STDOUT}" != *"$1"* ]]; then
        fail "expected stdout to contain '$1'"
    fi
}

expect_stdout_missing() {
    if [[ "${STDOUT}" == *"$1"* ]]; then
        fail "expected stdout not to contain '$1'"
    fi
}

expect_stderr_contains() {
    if [[ "${STDERR}" != *"$1"* ]]; then
        fail "expected stderr to contain '$1'"
    fi
}

# The stub logs every curl invocation's arguments, one line per request; these
# match that log with grep -E, so tests can assert what was asked of CouchDB.
expect_request_matching() {
    if ! grep -qE -- "$1" "${REQUEST_LOG_FILE}"; then
        fail "expected a curl request matching '$1'"
    fi
}

expect_no_request_matching() {
    if grep -qE -- "$1" "${REQUEST_LOG_FILE}"; then
        fail "expected no curl request matching '$1'"
    fi
}

expect_request_count() {
    local actual
    actual="$(wc -l < "${REQUEST_LOG_FILE}" | tr -d '[:space:]')"
    if [ "${actual}" -ne "$1" ]; then
        fail "expected $1 curl request(s), got ${actual}"
    fi
}

begin_test() {
    CURRENT_TEST="$1"
    FAILURES_BEFORE_TEST=${FAILURES}
}

end_test() {
    if [ "${FAILURES}" -gt "${FAILURES_BEFORE_TEST}" ]; then
        echo "FAIL ${CURRENT_TEST}"
        echo "    --- stdout ---"
        sed 's/^/    /' "${STDOUT_FILE}"
        echo "    --- stderr ---"
        sed 's/^/    /' "${STDERR_FILE}"
    else
        echo "ok   ${CURRENT_TEST}"
    fi
}

echo "Running ${SETUP_SCRIPT} tests"

begin_test "reports the admin user as present when CouchDB answers 200, and leaves it alone"
run_setup_script 200 0
expect_exit_code 0
expect_stdout_contains "Admin user exists"
expect_stdout_missing "Admin user does not exist"
expect_no_request_matching "X PUT .*/_config/admins/"
end_test

begin_test "creates the admin user when CouchDB answers 404"
run_setup_script 404 0
expect_exit_code 0
expect_stdout_contains "Admin user does not exist, creating..."
expect_request_matching "X PUT .*/_config/admins/admin"
end_test

begin_test "aborts before doing any setup work when CouchDB cannot be reached"
run_setup_script 000 7
expect_failed_exit_code
expect_stdout_missing "Admin user does not exist"
expect_stdout_missing "Successfully created"
expect_stdout_missing "Creating"
expect_request_count 1
expect_stderr_contains "Unable to determine whether the admin user exists"
expect_stderr_contains "http://localhost:5984"
end_test

begin_test "aborts before doing any setup work when CouchDB rejects the credentials"
run_setup_script 401 0
expect_failed_exit_code
expect_stdout_missing "Admin user does not exist"
expect_stdout_missing "Successfully created"
expect_request_count 1
expect_stderr_contains "Unable to determine whether the admin user exists"
expect_stderr_contains "401"
end_test

begin_test "aborts before doing any setup work when CouchDB reports a server error"
run_setup_script 500 0
expect_failed_exit_code
expect_stdout_missing "Admin user does not exist"
expect_stdout_missing "Successfully created"
expect_request_count 1
expect_stderr_contains "Unable to determine whether the admin user exists"
expect_stderr_contains "500"
end_test

begin_test "aborts just as loudly when executed directly, with the shebang's -e active"
run_setup_script 000 7 direct
expect_failed_exit_code
expect_stdout_missing "Admin user does not exist"
expect_stderr_contains "Unable to determine whether the admin user exists"
end_test

if [ "${FAILURES}" -gt 0 ]; then
    echo "${FAILURES} assertion(s) failed"
    exit 1
fi

echo "All assertions passed"
