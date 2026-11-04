#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.asdf/shims:$PATH"
cd "$(dirname "$0")/../contracts/testing"
export NEAR_SANDBOX_BINARY_PATH="$HOME/.cache/last-light-sandbox-2.14.0/Linux-x86_64"
export NEAR_SANDBOX_BIN_PATH="$NEAR_SANDBOX_BINARY_PATH"
if [ ! -x "$NEAR_SANDBOX_BINARY_PATH/near-sandbox" ]; then
  cache_dir="$HOME/.cache/last-light-sandbox-2.14.0"
  mkdir -p "$cache_dir"
  curl -fL --max-time 120 https://s3-us-west-1.amazonaws.com/build.nearprotocol.com/nearcore/Linux-x86_64/2.14.0/near-sandbox.tar.gz -o "$cache_dir/sandbox.tar.gz"
  tar -xzf "$cache_dir/sandbox.tar.gz" -C "$cache_dir"
fi
"$NEAR_SANDBOX_BINARY_PATH/near-sandbox" --version
node sandbox.mjs
