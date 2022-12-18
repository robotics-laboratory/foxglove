#!/bin/sh
cd /src
find . -name "*.foxe" -print > extensions.list
printf "[bootstrap] Found $(wc -l < extensions.list) extensions in /src\n"
