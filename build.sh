#!/usr/bin/env bash

opt=$1

case $opt in

setup)
    if [[ ("${TRAVIS_BRANCH}" == "master" || "${TRAVIS_BRANCH}" == "develop")  && "${TRAVIS_PULL_REQUEST}" != "false" ]]; then
        echo "Setup - Branch is ${TRAVIS_BRANCH}"
    fi
    ;;
test)
    echo "Travis branch is: ${TRAVIS_BRANCH}"
    echo "Travis PR: ${TRAVIS_PULL_REQUEST}"
    if [[ ("${TRAVIS_BRANCH}" == "master" || "${TRAVIS_BRANCH}" == "develop")  && "${TRAVIS_PULL_REQUEST}" != "false" ]]; then
        npm test
    fi
    ;;
esac