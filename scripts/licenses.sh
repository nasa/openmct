# Usage:
# ./scripts/licenses.sh <directory> <extension> <license>
# e.g.
# ./scripts/licenses.sh platform js scripts/license.js
#
# Note that this will ignore anything in a lib directory

LICENSE=`cat $3`
MATCHES=`find $1 -name "*.$2" | grep -v /lib/`

for i in $MATCHES
do
  cat "$3" "$i" > "$i".new && mv "$i".new "$i"
done
