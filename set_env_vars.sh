#!/bin/bash

# Initialize an empty string to collect all key-value pairs
secrets=""

# Read the .env file and append to the secrets string
while IFS= read -r line; do
    # Skip lines that start with a # or are empty
    if [[ "$line" != \#* && "$line" != "" && "$line" = *=* ]]; then
        secrets+="$line "
    fi
done < .env

# Remove the trailing space
secrets=${secrets% }

# Use flyctl to set all the secrets at once
if [[ ! -z "$secrets" ]]; then
    echo "Setting secrets: $secrets"
    flyctl secrets set $secrets
else
    echo "No valid secrets found in .env"
fi