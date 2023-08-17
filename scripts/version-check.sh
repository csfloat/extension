CURRENT_VERSION=$(jq '.version' manifest.json | tr -d '"')
NEW_VERSION="$VERSION"

if ! echo "$CURRENT_VERSION" | grep -Eq '^[0-9]+.[0-9]+.[0-9]+$'; then
  echo Error: Current version not in valid format
  exit 1
fi

if ! echo "$NEW_VERSION" | grep -Eq '^[0-9]+.[0-9]+.[0-9]+$'; then
  echo Error: New version not in valid format
  exit 1
fi

IFS='.' read -ra CURR <<< "$CURRENT_VERSION"
IFS='.' read -ra NEW <<< "$NEW_VERSION"

for i in ${!NEW[*]}; do
  if [ $((NEW[i])) -lt $((CURR[i])) ]; then
    echo ERROR: New release version is less than current release version
    exit 1
  elif [ $((NEW[i])) -gt $((CURR[i])) ]; then
    exit 0
  fi
done

echo Error: Current and new version are equal
exit 1