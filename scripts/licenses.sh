
MATCHES=`find $1 -name "*.$2" | grep -v /lib/`

for i in $MATCHES
do
  if ! grep -q "$LICENSE" $i
  then
    cat $3 $i > "$i".new && mv "$i".new "$i"
  fi
done

echo "$LICENSE"