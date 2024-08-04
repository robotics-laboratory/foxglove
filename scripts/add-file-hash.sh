#!/bin/bash -e

source=$1
name=${source%.*}
ext=${source#"$name."}
hash=$(md5sum $source | head -c 8)
target=$name.$hash.$ext
echo "$source -> $target"
mv $source $target
