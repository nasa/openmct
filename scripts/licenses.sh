LICENSE=`cat $3`
MATCHES=`find $1 -name "*.$2" | grep -v /lib/`

for i in $MATCHES
do
  cat "$3" "$i" > "$i".new && mv "$i".new "$i"
done
