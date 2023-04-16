#!/bin/sh
cd /src
find . -name "*.foxe" -print > extensions.list
printf "[bootstrap] Found $(wc -l < extensions.list) server extensions\n"
find layouts -name "*.json" -print > layouts.list
printf "[bootstrap] Found $(wc -l < extensions.list) server layouts\n"
