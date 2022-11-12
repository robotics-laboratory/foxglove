#!/bin/sh
cd /src
find . -name "*.foxe" -print > extensions.txt
printf "[bootstrap] Found $(wc -l < extensions.txt) extensions in /src\n"
