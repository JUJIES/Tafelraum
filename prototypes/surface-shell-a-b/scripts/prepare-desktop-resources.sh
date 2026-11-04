#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
project_dir="${script_dir:h}"
resources_dir="$project_dir/desktop-resources"
node_binary="$(node "$project_dir/../../scripts/prepare-macos-node.mjs")"

cd "$project_dir"
npm run build

rm -rf "$resources_dir"
node "$project_dir/../../scripts/stage-desktop-common.mjs" "$resources_dir"
office_app="$(node "$project_dir/../../scripts/prepare-office-runtime.mjs")"
node "$project_dir/../../scripts/prepare-headless-office.mjs" "$office_app" "$resources_dir"
if ! lipo "$node_binary" -verify_arch arm64 >/dev/null 2>&1; then
  print -u2 "Die lokale Node-Laufzeit enthält keine ARM64-Version: $node_binary"
  exit 1
fi
if [[ "$(lipo "$node_binary" -archs)" == "arm64" ]]; then
  cp "$node_binary" "$resources_dir/runtime/node"
else
  lipo -thin arm64 "$node_binary" -output "$resources_dir/runtime/node"
fi
chmod 755 "$resources_dir/runtime/node"

"$resources_dir/runtime/node" --version >/dev/null
node "$project_dir/../../scripts/prepare-runtime-notices.mjs" "$resources_dir"
print "Desktop-Ressourcen vorbereitet: $resources_dir"
