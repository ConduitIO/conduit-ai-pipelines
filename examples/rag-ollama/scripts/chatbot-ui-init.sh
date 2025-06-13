#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <workdir>"
  exit 1
fi

WORKDIR="$1"
ENV_PATH="$WORKDIR/.env.local"

if [ -n "$2" ]; then
  ENV_PATH="$2"
fi

supabase status --workdir $WORKDIR --output json | jq -r '"NEXT_PUBLIC_SUPABASE_URL=" + .API_URL, "NEXT_PUBLIC_SUPABASE_ANON_KEY=" + .ANON_KEY, "SUPABASE_SERVICE_ROLE_KEY=" + .SERVICE_ROLE_KEY' | while read line; do
  var_name=$(echo "$line" | cut -d'=' -f1)
  var_value=$(echo "$line" | cut -d'=' -f2-)
  if grep -q "^$var_name=" "$ENV_PATH"; then
    sed -i '' "s|^$var_name=.*|$line|" "$ENV_PATH"
  else
    echo "$line" >> "$ENV_PATH"
  fi
done