#!/bin/zsh
set -euo pipefail

script_dir="${0:A:h}"
project_dir="${script_dir:h}"
resources_dir="$project_dir/desktop-resources"
node_binary="$(command -v node)"

cd "$project_dir"
npm run build

rm -rf "$resources_dir"
mkdir -p "$resources_dir/web" "$resources_dir/server" "$resources_dir/runtime"
node "$project_dir/../../scripts/desktop-release-config.mjs" "$resources_dir/server/desktop-release.json"
node "$project_dir/../../scripts/prepare-agent-kit.mjs" "$resources_dir/agent-kit"
ditto "$project_dir/dist" "$resources_dir/web"
cp "$project_dir/distribution.json" \
  "$project_dir/desktop-server.mjs" \
  "$project_dir/agent-kit-server.mjs" \
  "$project_dir/canvas-agent-server.mjs" \
  "$project_dir/canvas-agent-protocol.mjs" \
  "$project_dir/teaching-agent-protocol.mjs" \
  "$project_dir/live-canvas-provisioning.mjs" \
   "$project_dir/archive-server.mjs" \
   "$project_dir/student-notes-server.mjs" \
   "$project_dir/student-notes-store.mjs" \
   "$project_dir/office-import.mjs" \
   "$project_dir/material-removal.mjs" \
   "$project_dir/interactive-html-state-bridge.mjs" \
   "$project_dir/interactive-html-playback.mjs" \
   "$project_dir/interactive-material.mjs" \
   "$project_dir/interactive-html-sentence-check.mjs" \
   "$project_dir/sentence-check-contract.mjs" \
   "$project_dir/ai-settings-extension.mjs" \
   "$project_dir/mobile-capture-receiver.mjs" \
   "$project_dir/document-image-server.mjs" \
   "$resources_dir/server/"
if [[ "$(node -p "JSON.parse(require('fs').readFileSync('distribution.json','utf8')).profile")" == "personal" ]]; then
  cp "$project_dir/sentence-assessment-core.mjs" "$project_dir/sentence-check-tasks.mjs" \
     "$project_dir/personal-ai-key.mjs" "$project_dir/personal-ai-settings.mjs" "$resources_dir/server/"
fi
mkdir -p "$resources_dir/server/office-import"
cp "$project_dir/office-import/runtime.json" "$resources_dir/server/office-import/"
office_app="$(node "$project_dir/../../scripts/prepare-office-runtime.mjs")"
mkdir -p "$resources_dir/runtime/libreoffice"
ditto "$office_app" "$resources_dir/runtime/libreoffice/LibreOffice.app"
cp "$project_dir/office-import/runtime.json" "$resources_dir/runtime/libreoffice/provenance.json"
mkdir -p "$resources_dir/server/document-image"
cp "$project_dir/document-image/worker.py" "$project_dir/document-image/mbd.py" "$project_dir/document-image/perspective.py" "$project_dir/document-image/LICENSE.DocRes" "$resources_dir/server/document-image/"
cp "$project_dir/../../shared/mobile-capture/protocol.mjs" "$resources_dir/server/mobile-capture-protocol.mjs"

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
